var Random = require('random-js'),
    path = require('path'),
    child_process = require('child_process'),
    execSync = require('child_process').execSync,
    fs = require('fs');
  

var fuzzer = 
{
    random : new Random(Random.engines.mt19937().seed(process.argv.slice(2))),
    
    seed: function (kernel)
    {
        fuzzer.random = new Random(Random.engines.mt19937().seed(kernel));
    },

    mutate:
    {
        string: function(val)
        {
            var lines = val.split("\n");
            var new_lines = "";
            lines.forEach( function(line) {
                
                // if( fuzzer.random.bool(0.2) )
                if ( Math.random() > 0.9)
                {                
                    if( line.match(" > ")){
                        // console.log("line before: ",line);
                        line = line.replace(">","<");
                        // console.log("line after: ",line);
                    }
                    else if(line.match(" < ")){
                        // console.log("line before: ",line);
                        line = line.replace("<",">");
                        // console.log("line after: ",line);
                    }
                }
                
                // if( fuzzer.random.bool(0.8) )
                if ( Math.random() > 0.8)
                {                
                    if( line.match(" >= ")){
                        // console.log("line before: ",line);
                        line = line.replace(">=","<");
                        // console.log("line after: ",line);
                    }
                    else if(line.match(" <= ")){
                        // console.log("line before: ",line);
                        line = line.replace("<=",">");
                        // console.log("line after: ",line);
                    }
                }
                // if( fuzzer.random.bool(1) )
                // if ( fuzzer.random.integer(1,100) > 45)
                if (Math.random() > 0.65)
                {
                    if( line.match(" == ")){
                        // console.log("line before: ",line);
                        line = line.replace("==","!=");
                        // console.log("line after: ",line);
                    }
                    else if(line.match(" != ")){
                        // console.log("line before",line);
                        line = line.replace("!=","==");
                        // console.log("line after",line);
                    }
                }
                
                // if ( fuzzer.random.bool(0.6))
                if (Math.random() > 0.7)
                {
                    if( line.match("if") || line.match("while") || line.match("for"))
		    {
		        if ( line.match(" && "))
			{
                            line = line.replace(" && "," || ");
			}
			else if( line.match(" || "))
			{
                            line = line.replace(" || "," && ");
			}
		    }
                }
                
                // if( fuzzer.random.integer(1,100) > 25 )
                if (Math.random() > 0.85)
                {
                    if( line.match(/\+\+/g) ){
                        // console.log("line before",line);
                        line = line.replace("++","--");
                        // console.log("line after",line);
                    }
                    else if(line.match("--")){
                        // console.log("line before",line);
                        line = line.replace("--","++");
                        // console.log("line after",line);
                    }
                }
                // console.log("line")
                // console.log("new line: "+line)
                new_lines += line + '\n';
            });
            // console.log(new_lines)
            return new_lines
        }
    }
};

const getFilePaths = (dir, filelist = []) => {
    // Walk through the dir recursively and add file paths to a list
    fs.readdirSync(dir).forEach(file => {
        if (fs.statSync(path.join(dir,file)).isDirectory() && !dir.match("models")) {
            filelist = getFilePaths(path.join(dir,file),filelist);
        }
        else if (path.join(dir,file).match(/\.java$/)){
                filelist.push(path.join(dir,file));
        }

    });
  return filelist;
  }


function mutationTesting(path)
{    
    // Alter file contents randomly and write to same file
    var fileContent = fs.readFileSync(path,'utf-8');
    let mutatedString = fuzzer.mutate.string(fileContent);
    fs.writeFileSync(path, mutatedString,'utf-8',function(err){
        console.log("Encounterd error while writing to file ",path);
        console.log(err);
    });
}


const fuzzing = () => {
    var maxRetries = 10;
    var compileSuccess = true; 
    var seedVal = process.argv.slice(2);
    var srcHash = process.argv.slice(3); 
    // Get path to java files to be modified 
    let filepaths = getFilePaths('{{ itrust_test_dir }}/iTrust2/src/main/java/edu/ncsu/csc/itrust2/');
    // let srcHash = execSync(`git rev-parse HEAD`).toString().trim();
    for (var i = 0; i < maxRetries; i++) {
        // Revert to original branch state
	    // execSync(`git reset --hard ${srcHash}`);
        // Perform code changes using fuzzer for multiple iterations
        filepaths.forEach(file => {
            fuzzer.seed(seedVal);
	    // if ( fuzzer.random.bool(0.5) ){
            if (Math.random() > 0.9){
            	mutationTesting(file);
	    }
        });
        var res = child_process.spawnSync('mvn', ['compile'], {
            cwd: '{{ itrust_test_dir }}/iTrust2/'
        });
        res = res.stdout.toString('utf-8') + res.stderr.toString('utf-8');
        if (!res.match("BUILD FAILURE")){
            compileSuccess = true;
            break;
        }
        else{
            compileSuccess = false;
            execSync(`cd {{ itrust_test_dir }} && git reset --hard ${srcHash}`);
        }
        // Commit the changed source code to the iTrust repo
	// execSync(`git add . && git commit -m "Fuzzer commit #{i+1}"`);
        // Trigger Jenkins build (using post-commit git hook) 
     }
//      if (compileSuccess == false){
//          execSync(`git reset --hard ${srcHash}`)
//      }
}

fuzzing();
// fuzzer.seed(0);
// mutationTesting('iTrust2-v4/iTrust2/src/main/java/edu/ncsu/csc/itrust2/config/FailureHandler.java');
