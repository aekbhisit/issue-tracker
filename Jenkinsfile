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
    // Enable BuildKit for better caching and performance (requires Docker 20.10+)
    DOCKER_BUILDKIT  = '1'
    TAG              = "${env.BUILD_NUMBER}"
    GIT_COMMIT_SHORT = 'unknown'  // Will be updated after checkout
    
    // Build-time environment variables for Next.js apps:
    // NEXT_PUBLIC_* variables MUST be set at build time (baked into the bundle)
    // These can be set as Jenkins job parameters or environment variables
    // Default values are provided in the build stages if not set
    // Runtime configuration (DATABASE_URL, JWT_SECRET, etc.) is provided via docker-compose
    
    // Build cache configuration
    USE_BUILD_CACHE  = "${env.USE_BUILD_CACHE ?: 'true'}"  // Enable/disable build cache
    USE_BUILDX       = "${env.USE_BUILDX ?: 'true'}"        // Use buildx for better caching
  }

  stages {

    stage('Preflight') {
      steps {
        sh '''
          set -eu
          echo "🔍 Checking Docker environment..."
          docker version
          # Check if buildx is available (for better caching)
          if docker buildx version > /dev/null 2>&1; then
            echo "✅ Docker Buildx available"
            # Create builder if it doesn't exist
            docker buildx create --name multiarch --use --driver docker-container 2>/dev/null || \
            docker buildx use multiarch 2>/dev/null || true
          else
            echo "⚠️  Docker Buildx not available, using standard build"
          fi
          echo "📊 Available disk space:"
          df -h /var/lib/docker || df -h .
          # Check disk space and fail if less than 5GB free
          AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
          if [ "$AVAILABLE" -lt 5 ]; then
            echo "⚠️  WARNING: Less than 5GB free disk space (${AVAILABLE}GB available)"
            echo "🧹 Running selective cleanup..."
            # Only remove stopped containers and dangling images (preserve cache)
            docker container prune -f || true
            docker image prune -f || true
            # Check again after cleanup
            AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
            if [ "$AVAILABLE" -lt 2 ]; then
              echo "❌ CRITICAL: Less than 2GB free after cleanup (${AVAILABLE}GB available)"
              exit 1
            fi
          fi
          echo "✅ Disk space check passed (${AVAILABLE}GB available)"
        '''
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
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
                  
                  # Quick file checks (fail fast)
                  test -f infra/docker/postgres/Dockerfile.prod || { echo "❌ Dockerfile.prod not found!"; exit 1; }
                  test -d infra/docker/postgres/initdb || { echo "❌ Init scripts directory not found!"; exit 1; }
                  
                  # Setup cache
                  CACHE_OPTS=""
                  if [ "${USE_BUILD_CACHE}" = "true" ]; then
                    # Use registry cache backend (faster than inline cache)
                    if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                      CACHE_OPTS="--cache-from type=registry,ref=${repo}:buildcache --cache-to type=registry,ref=${repo}:buildcache,mode=max"
                      # Also pull latest for cache
                      docker pull ${repo}:latest 2>/dev/null || echo "⚠️  No previous image for cache"
                    else
                      # Fallback to inline cache
                      docker pull ${repo}:latest 2>/dev/null || echo "⚠️  No previous image for cache"
                      CACHE_OPTS="--cache-from ${repo}:latest"
                    fi
                  fi
                  
                  # Build (using buildx if available for better caching)
                  if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                    docker buildx build --load ${CACHE_OPTS} -f infra/docker/postgres/Dockerfile.prod \\
                      -t ${repo}:${imageTag} -t ${repo}:latest \\
                      infra/docker/postgres || exit 1
                  else
                    docker build ${CACHE_OPTS} -f infra/docker/postgres/Dockerfile.prod \\
                      -t ${repo}:${imageTag} -t ${repo}:latest \\
                      infra/docker/postgres || exit 1
                  fi
                  
                  # Push both tags in parallel (background)
                  docker push ${repo}:${imageTag} &
                  docker push ${repo}:latest &
                  wait
                  echo "✅ ${image} built and pushed"
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
              def noCacheFlag = (env.DOCKER_NO_CACHE ?: '') == '1' ? '--no-cache' : ''
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  
                  # Quick file checks (fail fast, combined)
                  test -f pnpm-lock.yaml && test -f apps/api/package.json && \\
                  test -f infra/docker/api/Dockerfile.prod && test -d apps/api/src && \\
                  test -d infra/database && test -f infra/database/scripts/merge-schema.js && \\
                  test -d infra/database/prisma/schema || { echo "❌ Required files/directories missing!"; exit 1; }
                  
                  # Setup cache
                  CACHE_OPTS=""
                  if [ "${USE_BUILD_CACHE}" = "true" ] && [ -z "${noCacheFlag}" ]; then
                    if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                      # Use registry cache backend (much faster)
                      CACHE_OPTS="--cache-from type=registry,ref=${repo}:buildcache --cache-to type=registry,ref=${repo}:buildcache,mode=max"
                      # Pull previous images for cache (in background, don't wait)
                      docker pull ${repo}:latest 2>/dev/null &
                      docker pull ${repo}:${gitCommit} 2>/dev/null &
                    else
                      # Fallback: pull for inline cache
                      docker pull ${repo}:latest 2>/dev/null || true
                      docker pull ${repo}:${gitCommit} 2>/dev/null || true
                      CACHE_OPTS="--cache-from ${repo}:latest --cache-from ${repo}:${gitCommit}"
                    fi
                  fi
                  
                  # Build
                  if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                    docker buildx build --load ${CACHE_OPTS} ${noCacheFlag} \\
                      -f infra/docker/api/Dockerfile.prod \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  else
                    docker build ${CACHE_OPTS} ${noCacheFlag} \\
                      --build-arg BUILDKIT_INLINE_CACHE=1 \\
                      -f infra/docker/api/Dockerfile.prod \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  fi
                  
                  # Quick verification (only critical check)
                  docker run --rm ${repo}:${TAG} test -f /app/apps/api/dist/index.js || {
                    echo "❌ CRITICAL: dist/index.js not found in image!"
                    exit 1
                  }
                  
                  # Push all tags in parallel
                  docker push ${repo}:${TAG} &
                  docker push ${repo}:${gitCommit} &
                  docker push ${repo}:latest &
                  wait
                  echo "✅ ${image} built and pushed"
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
                  
                  # Quick file checks
                  test -f infra/docker/admin/Dockerfile.prod && test -d apps/admin && \\
                  test -d apps/collector-sdk || { echo "❌ Required files/directories missing!"; exit 1; }
                  
                  # Setup cache
                  CACHE_OPTS=""
                  if [ "${USE_BUILD_CACHE}" = "true" ]; then
                    if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                      # Use registry cache backend
                      CACHE_OPTS="--cache-from type=registry,ref=${repo}:buildcache --cache-to type=registry,ref=${repo}:buildcache,mode=max"
                      # Pull previous images (in background)
                      docker pull ${repo}:latest 2>/dev/null &
                      docker pull ${repo}:${gitCommit} 2>/dev/null &
                    else
                      # Fallback
                      docker pull ${repo}:latest 2>/dev/null || true
                      docker pull ${repo}:${gitCommit} 2>/dev/null || true
                      CACHE_OPTS="--cache-from ${repo}:latest --cache-from ${repo}:${gitCommit}"
                    fi
                  fi
                  
                  # Build
                  if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                    docker buildx build --load ${CACHE_OPTS} -f infra/docker/admin/Dockerfile.prod ${buildArgs} \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  else
                    docker build ${CACHE_OPTS} -f infra/docker/admin/Dockerfile.prod ${buildArgs} \\
                      --build-arg BUILDKIT_INLINE_CACHE=1 \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  fi
                  
                  # Quick verification
                  docker run --rm ${repo}:${TAG} test -d /app/apps/admin/.next || {
                    echo "⚠️  Warning: .next directory not found"
                  }
                  
                  # Push all tags in parallel
                  docker push ${repo}:${TAG} &
                  docker push ${repo}:${gitCommit} &
                  docker push ${repo}:latest &
                  wait
                  echo "✅ ${image} built and pushed"
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
              def buildArgs = [
                "--build-arg NEXT_PUBLIC_FRONTEND_API_URL=${env.NEXT_PUBLIC_FRONTEND_API_URL ?: ''}",
                "--build-arg NEXT_TELEMETRY_DISABLED=1"
              ].join(' ')
              docker.withRegistry("https://${HARBOR_URL}", HARBOR_CRED) {
                sh """
                  set -eu
                  echo "🚀 Building ${image}"
                  
                  # Quick file checks
                  test -f infra/docker/frontend/Dockerfile.prod && test -d apps/frontend || {
                    echo "❌ Required files/directories missing!"
                    exit 1
                  }
                  
                  # Setup cache
                  CACHE_OPTS=""
                  if [ "${USE_BUILD_CACHE}" = "true" ]; then
                    if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                      # Use registry cache backend
                      CACHE_OPTS="--cache-from type=registry,ref=${repo}:buildcache --cache-to type=registry,ref=${repo}:buildcache,mode=max"
                      # Pull previous images (in background)
                      docker pull ${repo}:latest 2>/dev/null &
                      docker pull ${repo}:${gitCommit} 2>/dev/null &
                    else
                      # Fallback
                      docker pull ${repo}:latest 2>/dev/null || true
                      docker pull ${repo}:${gitCommit} 2>/dev/null || true
                      CACHE_OPTS="--cache-from ${repo}:latest --cache-from ${repo}:${gitCommit}"
                    fi
                  fi
                  
                  # Build
                  if [ "${USE_BUILDX}" = "true" ] && docker buildx version > /dev/null 2>&1; then
                    docker buildx build --load ${CACHE_OPTS} -f infra/docker/frontend/Dockerfile.prod ${buildArgs} \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  else
                    docker build ${CACHE_OPTS} -f infra/docker/frontend/Dockerfile.prod ${buildArgs} \\
                      --build-arg BUILDKIT_INLINE_CACHE=1 \\
                      -t ${repo}:${TAG} -t ${repo}:${gitCommit} -t ${repo}:latest . || exit 1
                  fi
                  
                  # Quick verification
                  docker run --rm ${repo}:${TAG} test -d /app/apps/frontend/.next || {
                    echo "⚠️  Warning: .next directory not found"
                  }
                  
                  # Push all tags in parallel
                  docker push ${repo}:${TAG} &
                  docker push ${repo}:${gitCommit} &
                  docker push ${repo}:latest &
                  wait
                  echo "✅ ${image} built and pushed"
                """
              }
            }
          }
        }
      }
    }

    stage('Cleanup') {
      steps {
        sh '''
          set +e
          echo "🧽 Cleaning local build images..."
          # Only remove images from this specific build (preserve cache)
          docker images | awk -v R="${HARBOR_URL}/${HARBOR_PROJECT}" -v T="${TAG}" '$1 ~ R && $2 == T {print $3}' | xargs -r docker rmi -f || true
          # Only prune very old cache (older than 7 days) to preserve recent cache
          docker builder prune -af --filter "until=168h" || true
          echo "✅ Cleanup complete (cache preserved)"
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
  }
}
