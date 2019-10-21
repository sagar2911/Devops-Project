DevOps Project 

## Team 12
#### Members:
+ Ruturaj Vyawahare (rvyawah@ncsu.edu)
+ Avanti Santosh Lagavankar (alagava@ncsu.edu)
+ Sagar Bajaj (sbajaj@ncsu.edu)
+ Charan Ram Vellaiyur Chellaram (cvellai@ncsu.edu)

## Milestone 3
### Deployment
<ul>
 <li> We install all the dependencies on the jenkins server and set up mongodb and mysql servers</li>
 <li> We created production environment on the jenkins server for deployment of iTrust and checkbox.io</li>
 <li> Created bare repositories and set it as the remote repos for each of checkbox.io and iTrust</li>
 <li> Once the code is pushed into checkbox.io and iTrust repos deployment of checkbox and iTrust takes place on AWS instances</li>
 <li> We used ansible playbooks and roles to automate the whole task </li>
 </ul>


### Feature Flags
<ul>
 <li> We created redis server on the iTrust production server</li>
 <li> For demo we inserted a feature flag in the iTrust code that checks the feature flag called "afalg" from redis and turns on and off for the feature "edit patients" </li>
 </ul>
 
### Infrastructure upgrade
 <ul>
  <li> Spawned a kubernetes cluster with one master and 3 slaves and deployed the markdown to html fucnction as a service using docker containers</li>
 <li> The kubernetes master maintains the desired state by of the service ensuring that kubernetes pods always run the service. 
 <li> The master relaunches the required number of pods in the case of some pods going down, ensuring availability. 
 </ul>
 
### Special Something : Canary release 
<ul>
 <li> The deployment of Checkbox creates two production server checkbox1 hosting normal checkbox.io application and canary_checkbox hosting another version of the application. Canary release has some modifications in the original repo </li> 
 <li> infrastructure.js file does the load balancing between the origianl application and the canary release verison of it</li>
 <li> The balancer forwards 90% of the requests to the original application and 10% to the canary version </li>
 <li> The balancer run on jenkins server itself on port 3000. A single mongodb instance runs on jenkins server which are used by the production servers of original and canary version </li>
 </ul>
The canary release version repository is found here [canary-release](https://github.com/alagava/checkbox.io)

### Steps to execute

- Do baker bake and ssh into the ansible-controller
```
baker bake

baker ssh

cd /Project-DevOps
```

- Populate the env-setup file with AWS credentials and Git credentials snd run the shell script in ansible controller
```
source env-setup.sh
```
- Run the main ansible playbook
```
ansible-playbook playbook.yml
```
- SSH in into the Jenkins server and push changes to checkbox.io and iTrust2-v4 git sources to trigger the builds and start the deployments
```
cd checkbox.io
touch file
git add . && git commit -m "deploy" && git push prod master

cd iTrust2-v4
touch file
git add . && git commit -m "deploy" && git push prod master
```

### Contributions

**Ruturaj** - Kubernetes deplyment and iTrust deployment </br> 
**Avanti** - Checkbox deployment and special something </br>                       
**Charan** - Kubernetes deployment and iTrust deployment   </br>
**Sagar** - Implementation of feature flags

#### Screencast link
 
 The video link for the screencast can be found [screencast](https://youtu.be/JN1a0uyL2Fo)
 The video link for the Final Demo can be found [final-demo](https://youtu.be/ZD7wmORkbp4)
 
