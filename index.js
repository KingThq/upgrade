#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const cmd = require("node-cmd");
const localConfig = require("./config");

let data = fs.readFileSync(localConfig.fileName);
data = JSON.parse(data);

const { version, name } = data;

console.log(`当前版本号:${version}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let versionNum = "";

let currentVersion = "";
let nextVersion = "";
try{
  versionNum = version.includes(`-${localConfig.flag}`)?version.replace(`-${localConfig.flag}`,''):version.replace(localConfig.flag,'');
}catch(e){
  console.error(5555555, "版本号不存在！", e);
  process.exit(1);
}


run();

async function run() {
  try{
    if(version.includes(localConfig.flag)){

      let r = await question(`发行版本:${versionNum}?:`);
      if(r){
        currentVersion = r;
        versionNum = r;
      }else{
        currentVersion = versionNum;
      }
      
      let vs = versionNum.split(".");
      vs[vs.length-1]++;
      versionNum = vs.join('.');
  
      r = await question(`下一个开发版本:${versionNum}-${localConfig.flag}?:`);
      if(r){
        if(!r.includes(localConfig.flag)){
          let q = await question(`检测到您未添加开发版标识:${localConfig.flag},是否为您自动添加?:`)
          if(q){
            nextVersion = q;
          }else{
            nextVersion = `${r}-${localConfig.flag}`;
          }
        }else{
          nextVersion = r;
        }
      }else{
        nextVersion = `${versionNum}-${localConfig.flag}`;
      }
  
      await pushDevGit(currentVersion);
      await pushProGit(nextVersion);
  
    }else{
      throw `执行错误，非开发版！当前版本号为:${version}`;
    }
    console.log('执行完毕!');
    process.exit(0);
  }catch(e){
    console.log("脚本终止：",e)
    process.exit(1);
  }

}


function question(q) {
  return new Promise( resolve => {
    rl.question(q, answer => {
      answer = answer.trim();
      if(!!answer){
        resolve(answer);
      }else{
        resolve(false)
      }
    })
  })
}


async function pushDevGit(versions) {
  data.version = versions;
  fs.writeFileSync(localConfig.fileName,JSON.stringify(data,"","\t"));
  console.log("-----------------");
  let log = "";
  log = await cmdPromise(`git add ${localConfig.fileName}`);
  console.log(log);
  log = await cmdPromise(`git commit -m "[node-release-helper] prepare release ${name}-${versions}"`);
  console.log(log);
  log = await cmdPromise(`git tag ${name}-${versions}`);
  console.log(log);
  log = await cmdPromise(`git push`);
  console.log(log);
}

async function pushProGit(versions) {
  data.version = versions;
  fs.writeFileSync(localConfig.fileName,JSON.stringify(data,"","\t"));
  console.log("-----------------");
  let log = "";
  log = await cmdPromise(`git add ${localConfig.fileName}`);
  console.log(log);
  log = await cmdPromise(`git commit -m "[node-release-helper] for next development iteration"`);
  console.log(log);
  log = await cmdPromise(`git push`);
  console.log(log);
}


async function cmdPromise(str) {
  console.log(str);
  return new Promise( (resolve, reject) => {
    cmd.get(str,(err, data, stderr) => {
      if(!err){
        resolve(data);
      }else{
        reject(err);
      }
    })
  })
}

