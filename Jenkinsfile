pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    HARBOR_URL     = 'reg.haahii.com'
    HARBOR_PROJECT = 'haahii'
    HARBOR_CRED    = 'reg-haahii-robot-build'
    // Disable BuildKit if buildx is not available (set to '0' or unset)
    // DOCKER_BUILDKIT  = '1'
    TAG              = "${env.BUILD_NUMBER}"
    GIT_COMMIT_SHORT = 'unknown'  // Will be updated after checkout
    
    // Build-time environment variables for Next.js apps:
    // NEXT_PUBLIC_* variables MUST be set at build time (baked into the bundle)
    // These can be set as Jenkins job parameters or environment variables
    // Default values are provided in the build stages if not set
    // Runtime configuration (DATABASE_URL, JWT_SECRET, etc.) is provided via docker-compose
  }

  stages {

    stage('Preflight') {
      steps {
        sh '''
          set -eu
          echo "🔍 Checking Docker environment..."
          command -v docker
          docker version
          docker info || true
          echo "📊 Available disk space:"
          df -h /var/lib/docker || df -h .
          # Check disk space and fail if less than 5GB free
          AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
          if [ "$AVAILABLE" -lt 5 ]; then
            echo "⚠️  WARNING: Less than 5GB free disk space (${AVAILABLE}GB available)"
            echo "🧹 Running aggressive cleanup..."
            docker system prune -af --volumes || true
            docker builder prune -af || true
            # Check again after cleanup
            AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
            if [ "$AVAILABLE" -lt 2 ]; then
              echo "❌ CRITICAL: Less than 2GB free after cleanup (${AVAILABLE}GB available)"
              echo "Build cannot proceed. Please free up disk space manually."
              exit 1
            fi
          fi
          echo "✅ Disk space check passed (${AVAILABLE}GB available)"
          echo "🔐 Harbor registry connectivity:"
          docker login ${HARBOR_URL} -u ${HARBOR_CRED} --password-stdin < /dev/null || echo "Harbor login will be handled by docker.withRegistry"
        '''
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
        sh 'echo "✅ Repository checked out at commit ${GIT_COMMIT_SHORT}"'
      }
    }

    stage('Docker Cleanup') {
      steps {
        sh '''
          set -eu
          echo "🧹 Cleaning up Docker data before build..."
          # Remove stopped containers
          docker container prune -f || true
          # Remove unused images (keep last 10)
          docker image prune -af || true
          # Remove unused build cache
          docker builder prune -af || true
          # Remove unused volumes (be careful - this removes all unused volumes)
          docker volume prune -f || true
          echo "📊 Disk usage after cleanup:"
          docker system df || true
          df -h . || true
        '''
      }
    }

    stage('Build & Push Images') {
      parallel {

        stage('PostgreSQL') {
          environment { DOCKER_CONFIG = "${env.WORKSPACE}/.docker-postgres" }
          steps {
            sh 'mkdir -p "$DOCKER_CONFIG"'
            script {
              def image = 'postgres-pgvector-postgis'
              def repo  = "${HARBOR_URL}/${HARBOR_PROJECT}/${image}"
              def imageTag = '17.6'
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  echo "Build context: \$(pwd)"
                  echo "Image tag: ${imageTag}"
                  echo "Checking Dockerfile..."
                  if [ ! -f infra/docker/postgres/Dockerfile.prod ]; then
                    echo "❌ Dockerfile.prod not found!"
                    exit 1
                  fi
                  echo "Checking init scripts directory..."
                  if [ ! -d infra/docker/postgres/initdb ]; then
                    echo "❌ Init scripts directory not found!"
                    exit 1
                  fi
                  # Note: Dockerfile COPY will fail if init script is missing, so we just check directory exists
                  echo "✅ Dockerfile and init scripts directory found"
                  # Disable BuildKit if buildx is not available
                  DOCKER_BUILDKIT=0 docker build --pull -f infra/docker/postgres/Dockerfile.prod \\
                    -t ${repo}:${imageTag} -t ${repo}:latest \\
                    infra/docker/postgres || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${imageTag} latest; do
                    echo "Pushing tag: \$tag"
                    docker push ${repo}:\$tag || {
                      echo "❌ Push failed for \$tag"
                      exit 1
                    }
                    echo "✅ Successfully pushed ${repo}:\$tag"
                  done
                """
              }
            }
          }
        }

        stage('API') {
          environment { DOCKER_CONFIG = "${env.WORKSPACE}/.docker-api" }
          steps {
            sh 'mkdir -p "$DOCKER_CONFIG"'
            script {
              def image = 'issue-collector-api'
              def repo  = "${HARBOR_URL}/${HARBOR_PROJECT}/${image}"
              def gitCommit = env.GIT_COMMIT_SHORT ?: 'unknown'
              // Optional: disable Docker layer cache when DOCKER_NO_CACHE=1 is set in Jenkins env
              def noCacheFlag = (env.DOCKER_NO_CACHE ?: '') == '1' ? '--no-cache' : ''
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  echo "Build context: \$(pwd)"
                  echo "Git commit: ${gitCommit}"
                  echo "Checking lockfile..."
                  if [ ! -f pnpm-lock.yaml ]; then
                    echo "❌ pnpm-lock.yaml not found!"
                    exit 1
                  fi
                  echo "Verifying package.json..."
                  if [ ! -f apps/api/package.json ]; then
                    echo "❌ apps/api/package.json not found!"
                    exit 1
                  fi
                  echo "Checking Dockerfile..."
                  if [ ! -f infra/docker/api/Dockerfile.prod ]; then
                    echo "❌ infra/docker/api/Dockerfile.prod not found!"
                    exit 1
                  fi
                  echo "Verifying required directories..."
                  if [ ! -d apps/api/src ]; then
                    echo "❌ apps/api/src directory not found!"
                    exit 1
                  fi
                  if [ ! -d infra/database ]; then
                    echo "❌ infra/database directory not found!"
                    exit 1
                  fi
                  if [ ! -f infra/database/scripts/merge-schema.js ]; then
                    echo "❌ infra/database/scripts/merge-schema.js not found!"
                    exit 1
                  fi
                  if [ ! -d infra/database/prisma/schema ]; then
                    echo "❌ infra/database/prisma/schema directory not found!"
                    exit 1
                  fi
                  echo "✅ All required files and directories found"
                  # Disable BuildKit if buildx is not available
                  DOCKER_BUILDKIT=0 docker build --pull ${noCacheFlag} -f infra/docker/api/Dockerfile.prod \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "✅ Build completed successfully"
                  echo "Verifying image structure..."
                  docker run --rm ${repo}:${TAG} sh -c "test -d /app/apps/api/dist && test -f /app/apps/api/dist/index.js && echo '✅ dist/index.js verified' && ls -la /app/apps/api/dist/ | head -10 || (echo '❌ dist/index.js NOT FOUND' && echo 'Current directory structure:' && ls -la /app/apps/api/ && exit 1)" || {
                    echo "❌ CRITICAL: dist/index.js not found in image!"
                    echo "Build verification failed - image will not work correctly"
                    exit 1
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    docker push ${repo}:\$tag || {
                      echo "❌ Push failed for \$tag"
                      exit 1
                    }
                    echo "✅ Successfully pushed ${repo}:\$tag"
                  done
                '''
              }
            }
          }
        }

        stage('Admin') {
          environment { DOCKER_CONFIG = "${env.WORKSPACE}/.docker-admin" }
          steps {
            sh 'mkdir -p "$DOCKER_CONFIG"'
            script {
              def image = 'issue-collector-admin'
              def repo  = "${HARBOR_URL}/${HARBOR_PROJECT}/${image}"
              def gitCommit = env.GIT_COMMIT_SHORT ?: 'unknown'
              // Build arguments for Next.js (NEXT_PUBLIC_* variables must be set at build time)
              // Empty NEXT_PUBLIC_ADMIN_API_URL = relative URLs (for production with Nginx proxy)
              // Set to full URL if needed for your deployment
              // NEXT_PUBLIC_ADMIN_ASSET_PREFIX: '/admin' for path-based routing, empty for subdomain-based
              def buildArgs = [
                "--build-arg NEXT_PUBLIC_ADMIN_API_URL=${env.NEXT_PUBLIC_ADMIN_API_URL ?: ''}",
                "--build-arg NEXT_PUBLIC_ADMIN_AI_CHATBOT_ENABLED=${env.NEXT_PUBLIC_ADMIN_AI_CHATBOT_ENABLED ?: 'true'}",
                "--build-arg NEXT_PUBLIC_ADMIN_ASSET_PREFIX=${env.NEXT_PUBLIC_ADMIN_ASSET_PREFIX ?: '/admin'}",
                "--build-arg NEXT_PUBLIC_ADMIN_BASE_PATH=${env.NEXT_PUBLIC_ADMIN_BASE_PATH ?: '/admin'}",
                "--build-arg NEXT_TELEMETRY_DISABLED=1"
              ].join(' ')
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  echo "Build context: \$(pwd)"
                  echo "Git commit: ${gitCommit}"
                  echo "Build args: ${buildArgs}"
                  echo "Checking Dockerfile..."
                  if [ ! -f infra/docker/admin/Dockerfile.prod ]; then
                    echo "❌ infra/docker/admin/Dockerfile.prod not found!"
                    exit 1
                  fi
                  echo "Verifying required directories..."
                  if [ ! -d apps/admin ]; then
                    echo "❌ apps/admin directory not found!"
                    exit 1
                  fi
                  if [ ! -d apps/collector-sdk ]; then
                    echo "❌ apps/collector-sdk directory not found!"
                    exit 1
                  fi
                  echo "✅ All required files and directories found"
                  # Collector SDK is now built inside the Admin Dockerfile (multi-stage build).
                  # Jenkins no longer needs to run a separate Node container here.
                  # Disable BuildKit if buildx is not available
                  DOCKER_BUILDKIT=0 docker build --pull -f infra/docker/admin/Dockerfile.prod ${buildArgs} \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "✅ Build completed successfully"
                  echo "Verifying image structure..."
                  docker run --rm ${repo}:${TAG} ls -la /app/apps/admin/.next/ || {
                    echo "⚠️  Warning: Could not verify .next directory structure"
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    docker push ${repo}:\$tag || {
                      echo "❌ Push failed for \$tag"
                      exit 1
                    }
                    echo "✅ Successfully pushed ${repo}:\$tag"
                  done
                """
              }
            }
          }
        }

        stage('Frontend') {
          environment { DOCKER_CONFIG = "${env.WORKSPACE}/.docker-frontend" }
          steps {
            sh 'mkdir -p "$DOCKER_CONFIG"'
            script {
              def image = 'issue-collector-frontend'
              def repo  = "${HARBOR_URL}/${HARBOR_PROJECT}/${image}"
              def gitCommit = env.GIT_COMMIT_SHORT ?: 'unknown'
              // Build arguments for Next.js (NEXT_PUBLIC_* variables must be set at build time)
              // Empty NEXT_PUBLIC_FRONTEND_API_URL = relative URLs (for production with Nginx proxy)
              // Set to full URL if needed for your deployment
              def buildArgs = [
                "--build-arg NEXT_PUBLIC_FRONTEND_API_URL=${env.NEXT_PUBLIC_FRONTEND_API_URL ?: ''}",
                "--build-arg NEXT_TELEMETRY_DISABLED=1"
              ].join(' ')
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  echo "Build context: \$(pwd)"
                  echo "Git commit: ${gitCommit}"
                  echo "Build args: ${buildArgs}"
                  echo "Checking Dockerfile..."
                  if [ ! -f infra/docker/frontend/Dockerfile.prod ]; then
                    echo "❌ infra/docker/frontend/Dockerfile.prod not found!"
                    exit 1
                  fi
                  echo "Verifying required directories..."
                  if [ ! -d apps/frontend ]; then
                    echo "❌ apps/frontend directory not found!"
                    exit 1
                  fi
                  echo "✅ All required files and directories found"
                  # Disable BuildKit if buildx is not available
                  DOCKER_BUILDKIT=0 docker build --pull -f infra/docker/frontend/Dockerfile.prod ${buildArgs} \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "✅ Build completed successfully"
                  echo "Verifying image structure..."
                  docker run --rm ${repo}:${TAG} ls -la /app/apps/frontend/.next/ || {
                    echo "⚠️  Warning: Could not verify .next directory structure"
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    docker push ${repo}:\$tag || {
                      echo "❌ Push failed for \$tag"
                      exit 1
                    }
                    echo "✅ Successfully pushed ${repo}:\$tag"
                  done
                """
              }
            }
          }
        }
      }
    }

    stage('Cleanup Local Images') {
      steps {
        sh '''
          set +e
          echo "🧽 Cleaning local build images..."
          # Remove images from this build
          docker images | awk -v R="${HARBOR_URL}/${HARBOR_PROJECT}" -v T="${TAG}" '$1 ~ R && $2 == T {print $3}' | xargs -r docker rmi -f || true
          # Aggressive cleanup of dangling images and build cache
          docker image prune -af || true
          docker builder prune -af || true
          echo "✅ Cleanup complete"
          echo "📊 Final disk usage:"
          df -h . || true
        '''
      }
    }
  }

  post {
    success {
      script {
        def gitCommit = env.GIT_COMMIT_SHORT ?: 'unknown'
        echo """
      ========================================
      ✅ BUILD & PUSH SUCCESSFUL
      ========================================
      Build Number: ${TAG}
      Git Commit: ${gitCommit}
      Harbor Registry: ${HARBOR_URL}/${HARBOR_PROJECT}
      Images:
        • postgres-pgvector-postgis:17.6
        • issue-collector-api:${TAG}
        • issue-collector-admin:${TAG}
        • issue-collector-frontend:${TAG}
      Tags also pushed: latest, ${gitCommit}
      ========================================
      """
      }
    }

    failure {
      script {
        def gitCommit = env.GIT_COMMIT_SHORT ?: 'unknown'
        echo """
      ========================================
      ❌ BUILD FAILED
      ========================================
      Build Number: ${TAG}
      Git Commit: ${gitCommit}
      Check logs above for the failing parallel stage.
      ========================================
      """
      }
    }

    always {
      sh '''
        echo "[POST] Final Disk Usage:"
        docker system df || true
      '''
    }
  }
}
