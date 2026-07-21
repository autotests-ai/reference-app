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
        // Repo / branch — Git plugin SCM on the job (Pipeline script from SCM), not build params.
        checkout scm
      }
    }

    stage('Prepare') {
      steps {
        sh '''
          set -eu
          # Profiles are committed (Owner config/${env}.properties). Node/Allure/proxychains — in java-jdk21 agent image.
          test -f tests/src/test/resources/config/reference_prod_api.properties
          grep -q 'reference-app.autotests.ai' tests/src/test/resources/config/reference_prod_api.properties
          command -v node >/dev/null
          command -v allure >/dev/null
          node --version
          allure --version
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
            // Plugin looks up `allure` on agent PATH (baked into java-jdk21 image)
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

              JAR=allure-notifications-5.0.3.jar
              if [ ! -f "$JAR" ]; then
                curl -fsSL -o "$JAR" \
                  "https://github.com/qa-guru/allure-notifications/releases/download/v5.0.3/$JAR"
              fi
              export REPORT_URL="${BUILD_URL}allure/"
              export DASHBOARD_URL="${BUILD_URL}allure/"
              export TESTOPS_URL="${ALLURE_ENDPOINT}/project/${ALLURE_PROJECT_ID}"
              CONFIG=notifications/config.runtime.json
              node <<'JS'
const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync("notifications/config.json", "utf8"));
cfg.base.project = `Reference App Jenkins #${process.env.BUILD_NUMBER}`;
cfg.base.links = {
  report: process.env.REPORT_URL,
  dashboard: process.env.DASHBOARD_URL,
  testops: process.env.TESTOPS_URL,
  build: process.env.BUILD_URL,
};
cfg.telegram.token = process.env.TELEGRAM_BOT_TOKEN;
cfg.telegram.chat = process.env.TELEGRAM_CHAT_ID;
cfg.telegram.topic = process.env.TELEGRAM_TOPIC_ID || "";
cfg.telegram.replyTo = "";
fs.writeFileSync("notifications/config.runtime.json", JSON.stringify(cfg, null, 2));
JS

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
