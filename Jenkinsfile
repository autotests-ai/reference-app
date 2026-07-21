// reference-app Tests — Jenkins (jenkins.qa.guru)
// Mirrors .github/workflows/reference_github-pyramid.yml prod slices.
// Allure 3 via allure-jenkins-plugin · TestOps via allure-jenkins (withAllureUpload) · Jira site global (jira.qa.guru).
// Confluence: taxonomy / TZ in space REF — not a Jenkins step (Application Link ↔ Jira).

pipeline {
  agent { label 'java-jdk21' }

  options {
    disableConcurrentBuilds(abortPrevious: true)
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    choice(
      name: 'TARGET',
      choices: ['prod_pyramid', 'prod_api', 'prod_e2e', 'prod_visual'],
      description: 'Pyramid slice (reference_prod + Selenoid)'
    )
    string(name: 'TEST_CLASS', defaultValue: '', description: 'Optional FQCN / method for --tests')
    string(name: 'TEST_CASE_ID', defaultValue: '', description: 'Allure TestOps case id (launch name)')
    string(name: 'GIT_REF', defaultValue: 'main', description: 'Git branch / tag / commit')
  }

  environment {
    ALLURE_ENDPOINT   = 'https://allure.qa.guru'
    ALLURE_PROJECT_ID = '5274'
    ALLURE_SERVER_ID  = 'Allure TestOps'
    ALLURE_RESULTS    = 'tests/build/allure-results'
    BROWSER_VERSION   = '148'
    APP_BASE_URL      = 'https://reference-app.autotests.ai/'
    JIRA_URL          = 'https://jira.qa.guru'
    CONFLUENCE_URL    = 'https://confluence.qa.guru'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        checkout([
          $class: 'GitSCM',
          branches: [[name: params.GIT_REF]],
          userRemoteConfigs: [[
            url: 'https://github.com/autotests-ai/reference-app.git',
            credentialsId: 'github-qa-guru-https'
          ]]
        ])
      }
    }

    stage('Prepare') {
      steps {
        sh '''
          set -eu

          # java-jdk21 agent image has no python — gen-env-configs.py materializes reference_prod_*.properties
          if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
            apt-get update -qq
            DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3
          fi
          if command -v python >/dev/null 2>&1; then
            python scripts/gen-env-configs.py
          else
            python3 scripts/gen-env-configs.py
          fi
          test -f tests/src/test/resources/config/reference_prod_api.properties
          grep -q 'reference-app.autotests.ai' tests/src/test/resources/config/reference_prod_api.properties

          # Node for Allure 3 CLI + quality gate — install under /opt so plugin PATH works after workspace wipe
          NODE_VER=24.11.0
          if [ ! -x /opt/node/bin/node ]; then
            NODE_TGZ="node-v${NODE_VER}-linux-x64.tar.gz"
            NODE_URL="https://nodejs.org/dist/v${NODE_VER}/${NODE_TGZ}"
            if command -v curl >/dev/null 2>&1; then
              curl -fsSL -o "$NODE_TGZ" "$NODE_URL"
            else
              wget -qO "$NODE_TGZ" "$NODE_URL"
            fi
            tar -xzf "$NODE_TGZ"
            rm -rf /opt/node
            mv "node-v${NODE_VER}-linux-x64" /opt/node
          fi
          export PATH="/opt/node/bin:$PATH"
          if [ ! -x /opt/node/bin/allure ]; then
            npm install -g allure@3.13.0
          fi
          ln -sfn /opt/node/bin/allure /usr/local/bin/allure
          ln -sfn /opt/node/bin/node /usr/local/bin/node
          ln -sfn /opt/node/bin/npx /usr/local/bin/npx
          echo "PATH=/opt/node/bin:/usr/local/bin:$PATH" > .jenkins-allure-path
          allure --version
          node --version
          which npx
          which allure
        '''
      }
    }

    stage('Tests') {
      steps {
        script {
          def launchName = params.TEST_CASE_ID?.trim()
            ? "TestOps #${params.TEST_CASE_ID} — reference-app #${env.BUILD_NUMBER}"
            : "Jenkins ${params.TARGET} — reference-app #${env.BUILD_NUMBER}"
          catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
            // Upload streams while tests write allure-results (plugin requires wrapper around the run)
            withAllureUpload(
              serverId: env.ALLURE_SERVER_ID,
              projectId: env.ALLURE_PROJECT_ID,
              name: launchName,
              tags: "jenkins,reference-app,${params.TARGET}",
              results: [[path: 'tests/build/allure-results']],
              silent: true
            ) {
              sh '''
                set +e
                # shellcheck disable=SC1091
                . ./.jenkins-allure-path
                export PATH
                cd tests
                COMMON_ARGS="-DbrowserVersion=${BROWSER_VERSION} -DbaseUrl=${APP_BASE_URL} -DapiBaseUrl=${APP_BASE_URL}"
                EXIT=0

                run_one() {
                  echo "==> $1"
                  shift
                  if [ -n "${TEST_CLASS:-}" ]; then
                    # word-split intentional for -D flags
                    # shellcheck disable=SC2086
                    ./gradlew test --tests "$TEST_CLASS" $COMMON_ARGS "$@"
                  else
                    # shellcheck disable=SC2086
                    ./gradlew "$@" $COMMON_ARGS
                  fi
                  code=$?
                  if [ "$code" -ne 0 ]; then EXIT=$code; fi
                }

                case "${TARGET}" in
                  prod_pyramid)
                    run_one "prod api" testApi -DpyramidStand=reference_prod
                    run_one "prod e2e smoke" testE2e -DpyramidStand=reference_prod \
                      -Djunit.jupiter.execution.parallel.enabled=false
                    ;;
                  prod_api)
                    run_one "prod api" testApi -DpyramidStand=reference_prod
                    ;;
                  prod_e2e)
                    run_one "prod e2e smoke" testE2e -DpyramidStand=reference_prod \
                      -Djunit.jupiter.execution.parallel.enabled=false
                    ;;
                  prod_visual)
                    run_one "prod visual" testVisual -DpyramidStand=reference_prod
                    ;;
                  *)
                    echo "Unknown TARGET=${TARGET}" >&2
                    exit 1
                    ;;
                esac

                GATE_EXIT=0
                if [ -d build/allure-results ] && [ -n "$(ls -A build/allure-results 2>/dev/null)" ]; then
                  ./gradlew allureQualityGate || GATE_EXIT=$?
                fi

                echo "TEST_EXIT=${EXIT}" > ../.jenkins-test-status
                echo "QUALITY_GATE_EXIT=${GATE_EXIT}" >> ../.jenkins-test-status
                exit "${EXIT}"
              '''
            }
          }
        }
      }
    }

    stage('Allure 3 report') {
      when {
        expression {
          return fileExists("${env.ALLURE_RESULTS}") &&
            sh(script: "ls -A '${env.ALLURE_RESULTS}' 2>/dev/null | head -1", returnStatus: true) == 0
        }
      }
      steps {
        sh """
          mkdir -p ${ALLURE_RESULTS}
          cat > ${ALLURE_RESULTS}/executor.json <<EOF
          {
            "name": "Jenkins",
            "type": "jenkins",
            "reportName": "Run #${env.BUILD_NUMBER}",
            "buildOrder": ${env.BUILD_NUMBER},
            "buildName": "${env.JOB_NAME} #${env.BUILD_NUMBER}",
            "buildUrl": "${env.BUILD_URL}",
            "reportUrl": "${env.BUILD_URL}allure/"
          }
          EOF
        """
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            // Plugin looks up `allure` on agent PATH (/usr/local/bin → /opt/node/bin)
            allure(
              allureVersion: '3',
              includeProperties: false,
              results: [[path: 'tests/build/allure-results']],
              configPath: 'tests/allurerc.mjs'
            )
          }
        }
        sh '''
          set +e
          . ./.jenkins-allure-path 2>/dev/null
          export PATH
          if [ ! -f tests/build/reports/allure-report/allureReport/awesome/index.html ]; then
            (cd tests && ./gradlew allureReport) || true
          fi
        '''
        publishHTML(target: [
          allowMissing         : true,
          alwaysLinkToLastBuild: true,
          keepAll              : true,
          reportDir            : 'tests/build/reports/allure-report/allureReport/awesome',
          reportFiles          : 'index.html',
          reportName           : 'Allure 3 Awesome'
        ])
      }
    }

    stage('Jira / Confluence links') {
      steps {
        script {
          // Badges already link TestOps/Allure — description stays a short one-liner for the Builds list.
          // Canon: Markup Formatter = Plain Text; no HTML. Target only in displayName.
          // RAG: docs/rag/config/ci-jenkins-build-description.md
          currentBuild.displayName = "#${env.BUILD_NUMBER} · ${params.TARGET}"
          currentBuild.description = "Jira/REF · Confluence/REF · TestOps/${env.ALLURE_PROJECT_ID}"
          echo "Jira ${env.JIRA_URL}/projects/REF · Confluence ${env.CONFLUENCE_URL}/display/REF · TestOps ${env.ALLURE_ENDPOINT}/project/${env.ALLURE_PROJECT_ID}"
          echo "Issue keys: use @Issue + @AllureId in tests — synced via TestOps ↔ Jira Application Link"
        }
      }
    }

    // ADR 008 — chat QA.GURU | Monitoring (-1004381150566), topic Reference-app (id=3).
    // Selectel agents cannot reach api.telegram.org directly → QA.GURU SOCKS5 via proxychains4.
    stage('Telegram notification') {
      when {
        expression {
          return fileExists('tests/build/allure-results') &&
            sh(script: "ls -A 'tests/build/allure-results' 2>/dev/null | head -1", returnStatus: true) == 0
        }
      }
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          withCredentials([
            string(credentialsId: 'telegram-monitoring-bot-token', variable: 'TELEGRAM_BOT_TOKEN'),
            string(credentialsId: 'telegram-monitoring-chat-id', variable: 'TELEGRAM_CHAT_ID'),
            string(credentialsId: 'telegram-reference-app-topic-id', variable: 'TELEGRAM_TOPIC_ID')
          ]) {
            sh '''
              set -eu
              # shellcheck disable=SC1091
              . ./.jenkins-allure-path 2>/dev/null || true
              export PATH="${PATH:-}"

              AWESOME="tests/build/reports/allure-report/allureReport/awesome"
              if [ ! -f "$AWESOME/summary.json" ] && [ -f allure-report/awesome/summary.json ]; then
                mkdir -p tests/build/reports/allure-report/allureReport
                cp -a allure-report/. tests/build/reports/allure-report/allureReport/
              fi
              if [ ! -f "$AWESOME/summary.json" ] && command -v allure >/dev/null 2>&1; then
                mkdir -p tests/build/reports/allure-report/allureReport
                allure generate tests/build/allure-results \
                  -o tests/build/reports/allure-report/allureReport \
                  --config tests/allurerc.mjs
              fi
              test -f "$AWESOME/summary.json"

              JAR=allure-notifications-5.0.2.jar
              if [ ! -f "$JAR" ]; then
                curl -fsSL -o "$JAR" \
                  "https://github.com/qa-guru/allure-notifications/releases/download/v5.0.2/$JAR"
              fi
              export REPORT_URL="${BUILD_URL}allure/"
              export DASHBOARD_URL="${BUILD_URL}allure/"
              export TESTOPS_URL="${ALLURE_ENDPOINT}/project/${ALLURE_PROJECT_ID}"
              CONFIG=notifications/config.runtime.json
              if command -v python >/dev/null 2>&1; then PY=python; else PY=python3; fi
              "$PY" - <<'PY'
import json, os
from pathlib import Path
cfg = json.loads(Path("notifications/config.json").read_text())
cfg["base"]["project"] = "Reference App Jenkins #%s" % os.environ["BUILD_NUMBER"]
cfg["base"]["links"] = {
    "report": os.environ["REPORT_URL"],
    "dashboard": os.environ["DASHBOARD_URL"],
    "testops": os.environ["TESTOPS_URL"],
    "build": os.environ["BUILD_URL"],
}
cfg["telegram"]["token"] = os.environ["TELEGRAM_BOT_TOKEN"]
cfg["telegram"]["chat"] = os.environ["TELEGRAM_CHAT_ID"]
cfg["telegram"]["topic"] = os.environ.get("TELEGRAM_TOPIC_ID") or ""
cfg["telegram"]["replyTo"] = ""
Path("notifications/config.runtime.json").write_text(json.dumps(cfg, indent=2))
PY

              if ! command -v proxychains4 >/dev/null 2>&1; then
                apt-get update -qq
                DEBIAN_FRONTEND=noninteractive apt-get install -y -qq proxychains4
              fi
              PROXY_IP="$(getent ahostsv4 proxy.qaguru.school | awk 'NR == 1 { print $1; exit }')"
              test -n "$PROXY_IP"
              PROXYCHAINS_CONFIG=.proxychains-telegram.conf
              printf '%s\n' \
                strict_chain \
                proxy_dns \
                'tcp_read_time_out 15000' \
                'tcp_connect_time_out 8000' \
                '[ProxyList]' \
                "socks5 ${PROXY_IP} 7777" \
                > "$PROXYCHAINS_CONFIG"

              proxychains4 -q -f "$PROXYCHAINS_CONFIG" \
                java "-DconfigFile=${CONFIG}" -jar "$JAR"
              echo "Telegram proxy send OK"
            '''
          }
        }
      }
    }
  }

  post {
    always {
      script {
        if (fileExists('.jenkins-test-status')) {
          def st = readFile('.jenkins-test-status')
          echo st
          def gate = (st =~ /QUALITY_GATE_EXIT=(\d+)/)
          def test = (st =~ /TEST_EXIT=(\d+)/)
          def gateCode = gate ? gate[0][1] as int : 0
          def testCode = test ? test[0][1] as int : 0
          if (testCode != 0) {
            currentBuild.result = 'FAILURE'
          } else if (gateCode != 0) {
            currentBuild.result = 'UNSTABLE'
          }
        }
      }
      archiveArtifacts artifacts: 'tests/build/allure-results/**', allowEmptyArchive: true, fingerprint: true
      deleteDir()
    }
  }
}
