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
    DOCKER_BUILDKIT  = '1'
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
          set -euxo pipefail
          echo "🔍 Checking Docker environment..."
          command -v docker
          docker version
          docker info || true
          echo "📊 Available disk space:"
          df -h /var/lib/docker || df -h .
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

    stage('Docker Cleanup (Weekly)') {
      when { anyOf { branch 'main'; branch 'master'; branch 'develop' } }
      steps {
        sh '''
          set -euxo pipefail
          echo "🧹 Cleaning up old Docker data..."
          docker image prune -af --filter "until=168h" || true
          docker builder prune -af --filter "until=168h" || true
          docker system df || true
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
                  set -euxo pipefail
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
                  echo "✅ Dockerfile and init scripts directory found"
                  docker build --pull -f infra/docker/postgres/Dockerfile.prod \\
                    -t ${repo}:${imageTag} -t ${repo}:latest \\
                    infra/docker/postgres || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${imageTag} latest; do
                    echo "Pushing tag: \$tag"
                    if ! docker push ${repo}:\$tag; then
                      echo "⚠️  First push failed for \$tag, retrying..."
                      sleep 5
                      if ! docker push ${repo}:\$tag; then
                        echo "❌ Push failed for \$tag after retry"
                        exit 1
                      fi
                    fi
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
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -euxo pipefail
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
                  docker build --pull -f infra/docker/api/Dockerfile.prod \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || {
                    echo "❌ Docker build failed"
                    exit 1
                  }
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    if ! docker push ${repo}:\$tag; then
                      echo "⚠️  First push failed for \$tag, retrying..."
                      sleep 5
                      if ! docker push ${repo}:\$tag; then
                        echo "❌ Push failed for \$tag after retry"
                        exit 1
                      fi
                    fi
                    echo "✅ Successfully pushed ${repo}:\$tag"
                  done
                """
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
                  set -euxo pipefail
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
                  docker build --pull -f infra/docker/admin/Dockerfile.prod ${buildArgs} \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest .
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    if ! docker push ${repo}:\$tag; then
                      echo "⚠️  First push failed for \$tag, retrying..."
                      sleep 5
                      if ! docker push ${repo}:\$tag; then
                        echo "❌ Push failed for \$tag after retry"
                        exit 1
                      fi
                    fi
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
                  set -euxo pipefail
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
                  docker build --pull -f infra/docker/frontend/Dockerfile.prod ${buildArgs} \\
                    -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest .
                  echo "📤 Pushing ${image}"
                  for tag in ${TAG} ${gitCommit} latest; do
                    echo "Pushing tag: \$tag"
                    if ! docker push ${repo}:\$tag; then
                      echo "⚠️  First push failed for \$tag, retrying..."
                      sleep 5
                      if ! docker push ${repo}:\$tag; then
                        echo "❌ Push failed for \$tag after retry"
                        exit 1
                      fi
                    fi
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
          docker images | awk -v R="${HARBOR_URL}/${HARBOR_PROJECT}" -v T="${TAG}" '$1 ~ R && $2 == T {print $3}' | xargs -r docker rmi -f || true
          echo "✅ Cleanup complete"
        '''
      }
    }
  }

  post {
    success {
      echo """
      ========================================
      ✅ BUILD & PUSH SUCCESSFUL
      ========================================
      Build Number: ${TAG}
      Git Commit: ${GIT_COMMIT_SHORT}
      Harbor Registry: ${HARBOR_URL}/${HARBOR_PROJECT}
      Images:
        • postgres-pgvector-postgis:17.6
        • issue-collector-api:${TAG}
        • issue-collector-admin:${TAG}
        • issue-collector-frontend:${TAG}
      Tags also pushed: latest, ${GIT_COMMIT_SHORT}
      ========================================
      """
    }

    failure {
      echo """
      ========================================
      ❌ BUILD FAILED
      ========================================
      Build Number: ${TAG}
      Git Commit: ${GIT_COMMIT_SHORT}
      Check logs above for the failing parallel stage.
      ========================================
      """
    }

    always {
      sh '''
        echo "[POST] Final Disk Usage:"
        docker system df || true
      '''
    }
  }
}
