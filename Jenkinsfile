pipeline {
    agent { 
         docker { 
            image 'node:12'
            label 'jenkins-jedi'
        }
     }

    stages {
    
        stage('Prepare environment') {
            steps {
                sh 'export WEB=true'
           }
        }
        
        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }        
    }
}
