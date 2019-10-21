var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");
var config = require('./config');
var crypto = require('crypto');
const JSON = require('circular-json');


function main()
{
	if (fs.existsSync(config.resultPath)) {
			fs.unlinkSync(config.resultPath);
	}
	if (fs.existsSync(config.reportFile)) {
		fs.unlinkSync(config.reportFile);
}
	var args = process.argv.slice(2);
	var files= getFiles(config.pathtocheckbox+"server-side/site/routes");
	if( args.length == 0 )
	{
		args = [config.pathtocheckbox+"server-side/site/marqdown.js"];		
	}
	args=args.concat(files);
	//console.log(args);
	for(var i=0; i<=args.length-1; i++)
	{
	var filePath = args[i];
	
	complexity(filePath);
		
	// Report
	
	}
	for( var node in builders )
	{
		var builder = builders[node];
		builder.report();
		if(builder.PassBuild==false)
		{
			fs.writeFile(config.resultPath, "false\n"+builder.FileName, function(err) {
				if(err) {
						return console.log(err);
				}
		});
	}
	}
	if (!fs.existsSync(config.resultPath)) {
		fs.writeFile(config.resultPath, "true\n"+this.FileName, function(err) {
			if(err) {
					return console.log(err);
			}
	});
	}
}
function getFiles (dir, files_){
	files_ = files_ || [];
	var files = fs.readdirSync(dir);
	for (var i in files){
			var name = dir + '/' + files[i];
			if (fs.statSync(name).isDirectory()){
					getFiles(name, files_);
			} else {
					files_.push(name);
			}
	}
	return files_;
}


var builders = {};

// Represent a reusable "class" following the Builder pattern.
function FunctionBuilder()
{
	this.StartLine = 0;
	this.FunctionName = "";
	// The number of parameters for functions
	this.ParameterCount  = 0,
	// Number of if statements/loops + 1
	this.SimpleCyclomaticComplexity = 0;
	// The max depth of scopes (nested ifs, loops, etc)
	this.MaxNestingDepth    = 0;
	// The max number of conditions if one decision statement.
	this.MaxConditions      = 0;

	this.isLongMethod=false;

	this.report = function()
	{
		fs.appendFileSync( config.reportFile,
		   (
		   	"{0}(): {1}\n" +
		   	"============\n" +
			   "SimpleCyclomaticComplexity: {2}\t" +
				"isLongMethod: {3}\t" +
				"MaxConditions: {4}\t" +
				"Parameters: {5}\n\n"
			)
			.format(this.FunctionName, this.StartLine,
				     this.SimpleCyclomaticComplexity, this.isLongMethod,
			        this.MaxConditions, this.ParameterCount)
		);
	}

};

// A builder for storing file level information.
function FileBuilder()
{
	this.FileName = "analysis.js";
	// Number of strings in a file.
	this.Strings = 0;
	this.containsSecurityToken = false;
	// Number of imports in a file.
	this.ImportCount = 0;
	this.PassBuild = true;
	this.longMethodCount=0;
	this.hasDuplicateCode=0;
	this.report = function()
	{
		fs.appendFileSync( config.reportFile,
			( "{0}\n" +
			  "~~~~~~~~~~~~\n"+
				"ImportCount {1}\t" +
				"Strings {2}\t" +
				"PassBuild {4}\t" +
				"hasDuplicateCode {5}\t" +
			  "SecurityTokenFound {3}\n"
			).format( this.FileName, this.ImportCount, this.Strings, this.containsSecurityToken, this.PassBuild, this.hasDuplicateCode ));
		
		}
	

}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

function convertTreeToList(root) {
	var stack = [], array = [], hashMap = {};


			traverseWithParents(root, function (node){
				if(node.type!=null)
				array.push(node.type);
			}); 

			// if(node.children == null) {
			// 		visitNode(node, hashMap, array);
			// } else {
			// 		node.children.forEach(function(element){
			// 			stack.push(element);
			// 		})
			// }
	
	return array;
}


// function visitNode(node, hashMap, array) {
// 	if(!hashMap[node.data]) {
// 			hashMap[node.data] = true;
// 			array.push(node.type);
// 			//console.log(node.type);
// 	}
// }

function findCyclomaticComplexity(node,builder,builders,fileBuilder){
	traverseWithParents(node, function (node1) 
	{	
		if(isDecision(node1))
		{
			builder.SimpleCyclomaticComplexity++;
			if(builder.SimpleCyclomaticComplexity>config.cyclomaticThreshhold)
			{
				fileBuilder.PassBuild=false;
				
			}
		}

		builders[builder.FunctionName] = builder;
	});
}

function findMaxConditions(node,builder,builders)
{
		traverseWithParents(node, function (node1) 
		{	
			var max=0;
			if(node1.type=="IfStatement")			{
				max=1;
				
				traverseWithParents(node1.test, function (node2) 
				{
					if(node2.operator=="&&" || node2.operator=="||")
					{	
							max++;
					}
				
					builders[builder.FunctionName] = builder;
				});

				if(max>builder.MaxConditions)
				{
					builder.MaxConditions=max;
					x=node1.test;
				}
			}
			builders[builder.FunctionName] = builder;
		});
}

function findLineCount(node,countLines)
{
	traverseWithParents(node, function (node1) 
	{	
			
			if(node1.type!=null && node1.type.includes("Statement"))
			{
				countLines++;
			}

			
		});
		return countLines;
}
function getNodeWeight(node,weight)
{
	traverseWithParents(node, function (node1) 
	{	
			weight++;
			
		});
		return weight;
}
function findFreeStyleStats(node,fileBuilder)
{
	if(node.type=="Literal" && typeof(node.value)=="string")
	{fileBuilder.Strings++;
		if(node.value.match("[0-9a-zA-Z/+]{40}")!=null || node.value.match("[0-9a-zA-Z/+]{32}")!=null){
				fileBuilder.containsSecurityToken=true;
		} 
	}

	if(node.type=="CallExpression" && node.callee.name=="require")
	{
		fileBuilder.ImportCount++;
	}
}

function complexity(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);
	var hashList=new Array;
	var weightList=new Array;
	// A file level-builder:
	var fileBuilder = new FileBuilder();
	fileBuilder.FileName = filePath;
	fileBuilder.ImportCount = 0;
	builders[filePath] = fileBuilder;
	var lineCount=0;
	var totalweight=0;
	//detect duplicate code
//	fileBuilder.hasDuplicateCode=detectDuplicate(ast);

//console.log(convertTreeToList(ast));

	// Traverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		var weight=0;
		weight = childrenLength(node);
		totalweight+=weight;
	//	hashList.push(JSON.stringify(convertTreeToList(node)));
		if(weight && weight>2){

	//	console.log(convertTreeToList(node));
		hashList.push(crypto.createHash('md5').update(JSON.stringify(convertTreeToList(node))).digest("hex"));
		weightList.push(weight);
		}

		if (node.type === 'FunctionDeclaration') 
		{
			var builder = new FunctionBuilder();

			builder.FunctionName = functionName(node);
			builder.StartLine    = node.loc.start.line;
			builder.ParameterCount=node.params.length;
			var countLines=0;
			

		//Finding number of lines
			countLines=findLineCount(node,countLines);
			

		//Finding cyclomatic complexity
			findCyclomaticComplexity(node,builder,builders,fileBuilder);


		//Finding out max conditions
			findMaxConditions(node,builder,builders);
	
	
		if(countLines>50)
		{
			builder.isLongMethod=true;
			fileBuilder.longMethodCount++;
		}
		

		if(fileBuilder.PassBuild==true){
				if(fileBuilder.longMethodCount>config.longMethodThreshhold)
				{
					fileBuilder.PassBuild==false;
				}
				if(builder.MaxConditions>config.MaxConditionsThreshhold)
				{
					fileBuilder.PassBuild==false;
				}
		}
	}

		lineCount=findLineCount(node,lineCount);
		//Finding out number of Strings, number of Imports and Security tokens || Free Style
		findFreeStyleStats(node,fileBuilder);
	
		fileBuilder.hasDuplicateCode	= hashListCompare(hashList,weightList)/(totalweight);
	});
		
		console.log(filePath);
		console.log(fileBuilder.hasDuplicateCode);

}
function hashListCompare(hashList,weightList) {
	var counts = [],totalDup=0,total=0;
	for(var i = 0; i <= hashList.length; i++) {
		if(weightList[i] && weightList[i]>5){
			//console.log(weightList[i]);
			if(counts[hashList[i]] === undefined) {
					counts[hashList[i]] = 1;
			} else {
					totalDup+=weightList[i];
			}
	}
}
	return totalDup;
}
// function hashListCompare(hashList,weightList) {
// 	var counts = [],totalDup=0;
// 	for(var i = 0; i <= hashList.length; i++) {
// 			for(var j = i; j <= hashList.length; j++) {
// 					if(i != j && hashList[i] == hashList[j]) {
// 						totalDup+=weightList[i];
// 					}
// 			}
		
// 	}
// 	return totalDup;
// }
// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

// Helper function for allowing parameterized formatting of strings.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();

function Crazy (argument) 
{

	var date_bits = element.value.match(/^(\d{4})\-(\d{1,2})\-(\d{1,2})$/);
	var new_date = null;
	if(date_bits && date_bits.length == 4 && parseInt(date_bits[2]) > 0 && parseInt(date_bits[3]) > 0)
    new_date = new Date(parseInt(date_bits[1]), parseInt(date_bits[2]) - 1, parseInt(date_bits[3]));

    var secs = bytes / 3500;

      if ( secs < 59 )
      {
          return secs.toString().split(".")[0] + " seconds";
      }
      else if ( secs > 59 && secs < 3600 )
      {
          var mints = secs / 60;
          var remainder = parseInt(secs.toString().split(".")[0]) -
(parseInt(mints.toString().split(".")[0]) * 60);
          var szmin;
          if ( mints > 1 )
          {
              szmin = "minutes";
          }
          else
          {
              szmin = "minute";
          }
          return mints.toString().split(".")[0] + " " + szmin + " " +
remainder.toString() + " seconds";
      }
      else
      {
          var mints = secs / 60;
          var hours = mints / 60;
          var remainders = parseInt(secs.toString().split(".")[0]) -
(parseInt(mints.toString().split(".")[0]) * 60);
          var remainderm = parseInt(mints.toString().split(".")[0]) -
(parseInt(hours.toString().split(".")[0]) * 60);
          var szmin;
          if ( remainderm > 1 )
          {
              szmin = "minutes";
          }
          else
          {
              szmin = "minute";
          }
          var szhr;
          if ( remainderm > 1 )
          {
              szhr = "hours";
          }
          else
          {
              szhr = "hour";
              for ( i = 0 ; i < cfield.value.length ; i++)
				  {
				    var n = cfield.value.substr(i,1);
				    if ( n != 'a' && n != 'b' && n != 'c' && n != 'd'
				      && n != 'e' && n != 'f' && n != 'g' && n != 'h'
				      && n != 'i' && n != 'j' && n != 'k' && n != 'l'
				      && n != 'm' && n != 'n' && n != 'o' && n != 'p'
				      && n != 'q' && n != 'r' && n != 's' && n != 't'
				      && n != 'u' && n != 'v' && n != 'w' && n != 'x'
				      && n != 'y' && n != 'z'
				      && n != 'A' && n != 'B' && n != 'C' && n != 'D'
				      && n != 'E' && n != 'F' && n != 'G' && n != 'H'
				      && n != 'I' && n != 'J' && n != 'K' && n != 'L'
				      && n != 'M' && n != 'N' &&  n != 'O' && n != 'P'
				      && n != 'Q' && n != 'R' && n != 'S' && n != 'T'
				      && n != 'U' && n != 'V' && n != 'W' && n != 'X'
				      && n != 'Y' && n != 'Z'
				      && n != '0' && n != '1' && n != '2' && n != '3'
				      && n != '4' && n != '5' && n != '6' && n != '7'
				      && n != '8' && n != '9'
				      && n != '_' && n != '@' && n != '-' && n != '.' )
				    {
				      window.alert("Only Alphanumeric are allowed.\nPlease re-enter the value.");
				      cfield.value = '';
				      cfield.focus();
				    }
				    cfield.value =  cfield.value.toUpperCase();
				  }
				  return;
          }
          return hours.toString().split(".")[0] + " " + szhr + " " +
mints.toString().split(".")[0] + " " + szmin;
      }
  }
 exports.main = main;
