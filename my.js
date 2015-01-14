var index = 0;
var jsonFile = ["patient.json","doctor.json","drug.json","Pharmacy.json","Pharm_company.json"];
var sql, nested = 0, nestedatt;
var attArray = [], strData = [], joinTable = [], joinTable2 = []; 

$( document ).ready(function() {
             
	var table = 0;
	//ShowTable(index,ShowTable);
	
	$('#in').keypress(function(e){              
		var keyCode  = e.keyCode || e.which;
		if(keyCode == '13'){
			sql = document.getElementById("in").value;
			$('#in').val("");
			$('.segment').show();
			joinTable = [];
			if(AnalyzeSql(sql)){
				document.getElementsByClassName('segment')[0].innerHTML = "<p>"+sql;  
			}
			else
				document.getElementsByClassName('segment')[0].innerHTML = "<p> Error SQL !! ";  
		}
	});

	$('.table').hide();
	$('.segment').hide();

});

/* Analyze the SQL query , cut query to few blocks */
function AnalyzeSql(sql){
	var sqlArray = sql.split(" ");
	var attribute = "";
	var tableList = "";
	var condition = "";
	var aggregate = "";
	var at = 0, ta = 0;

	if(!sqlArray[0].match(/select/i)) 
		return 0;
	else{
		for(var i=0 ; i<sqlArray.length ; i++){
			if (sqlArray[i].match(/select/i))
				continue;
			else if(sqlArray[i].match(/MAX(.*)/i)){
				aggregate += "MAX ";	
				var s = sqlArray[i].substring(4, sqlArray[i].length-1);
				attribute += s+" ";
				continue;
			}
			else if(sqlArray[i].match(/MIN(.*)/i)){
				aggregate += "MIN ";	
				var s = sqlArray[i].substring(4, sqlArray[i].length-1);
				attribute += s+" ";
				continue;
			}
			else if(sqlArray[i].match(/SUM(.*)/i)){
				aggregate += "SUM ";	
				var s = sqlArray[i].substring(4, sqlArray[i].length-1);
				attribute += s+" ";
				continue;
			}
			else if(sqlArray[i].match(/AVG(.*)/i)){
				aggregate += "AVG ";	
				var s = sqlArray[i].substring(4, sqlArray[i].length-1);
				attribute += s+" ";
				continue;
			}
			else if(sqlArray[i].match(/COUNT(.*)/i)){
				aggregate += "COUNT ";	
				var s = sqlArray[i].substring(6, sqlArray[i].length-1);
				attribute += s+" ";
				continue;
			}
			else if(!sqlArray[i].match(/select/i) && !sqlArray[i].match(/from/i) && at == 0){
                attribute += sqlArray[i]+" ";
				continue;
			}
			else if (sqlArray[i].match(/from/i)){
				at = 1;
				continue;
			}
			else if (!sqlArray[i].match(/select/i) && !sqlArray[i].match(/from/i) && !sqlArray[i].match(/where/i) && sqlArray[i] !="," && sqlArray[i] !=";" && at == 1 && ta == 0){
				tableList += sqlArray[i]+" ";
				continue;
			}
			else if(sqlArray[i].match(/where/i)){
				ta = 1;
				continue;
			}
			else if(sqlArray[i].match(/in/i)){
				nested = 1;
	//			console.log("nested = "+nested);
				NestedTable(i, sqlArray);
				break;
			}
			else if(sqlArray[i].match(/no/i) && sqlArray[i+1].match(/in/i)){
				nested = 2;
				NestedTable(i+1, sqlArray);
				break;
			}
			else if(!sqlArray[i].match(/select/i) && !sqlArray[i].match(/from/i) && !sqlArray[i].match(/where/i) && sqlArray[i] !="," && sqlArray[i] !=";" && at == 1 && ta == 1){
				condition += sqlArray[i]+" ";
				continue;
			}
			else if(sqlArray[i] == ";"){
				console.log("SQL done !!");
			}
		}
		console.log("attribute : "+ attribute);
		console.log("table : " + tableList);
		console.log("condition : " + condition);
		console.log("aggregate : " + aggregate);

		var tArray = tableList.split(" ");
		var conditionArray = condition.split("AND ");
	
		strData = new Array(tArray.length);
		attArray = [];
		CleanTable();
		
		for(var tLength in tArray)
			GetAttribute(attribute, tArray, tLength);

		JoinTable(tArray);
		for(var cLength in conditionArray)
			ShowData(attribute, tArray, 0, conditionArray[cLength], aggregate);
		
		function NestedTable(i, sqlArray){
			var nsql = "";
			for(var j = i+1 ; j<sqlArray.length ; j++){
				nsql += sqlArray[j]+" ";
			}
			console.log("nested sql = "+ nsql);
			AnalyzeSql(nsql);
		}
		
	}	

	return 1;
};
/* Get whole join table */
function JoinTable(tArray){
	var joinArray = [];
	var tmp = 0, index = 0;
	var jArray = [], exObj = [];
	var count = 0;
	
	FunctionJoin(index, FunctionJoin);
//	console.log(joinTable);
	
	function FunctionJoin(index, callback){
		if(tArray[index]!=""){
			var tablei = tArray[index];
		//	console.log("tablei = "+index+" "+tablei);
			$.ajax({
				url: tArray[index]+".json",
				dataType: 'json',
				async : false ,
				success: function(data){
					var dataArray = data;
					
					for(var t in dataArray){
						for(var a in attArray){
							var att = attArray[a].split(".");
					//		console.log("array = "+tablei);
							if(dataArray[t].hasOwnProperty(att[1]) && att[0] == tablei){
								dataArray[t][tablei+"."+att[1]] = dataArray[t][att[1]];
								delete dataArray[t][att[1]];
							}	
						}
					}
					joinArray.push(dataArray);
					tmp++;
			
					if(tmp == tArray.length-1){
						for(var i=0 ; i<tArray.length-2 ; i++){
							exObj = [];
							for(var j in joinArray[i]){
								for(var k in joinArray[i+1]){
									var ex = $.extend({},joinArray[i][j], joinArray[i+1][k]);
									exObj.push(ex);
									//joinTable.push(ex);
								}
							}
							joinArray[i+1] = exObj;
					//		console.log(joinArray[i+1]);
						}
						if(joinTable == "")
							joinTable = joinArray[i];
						else 
							joinTable2 = joinArray[i];
					//	console.log(joinTable);
					}
				}
			});
			index++;
			if(index < tArray.length){
				console.log("index = "+index);
				callback(index, callback);
			}
		
		}
	}
}

/* Get whole attributes and store it into attArray[] */
function GetAttribute(attribute, tArray, tLength){
	if(tArray[tLength] != ""){
		console.log("tArray = "+tArray[tLength]);

		$.ajax({
			url: tArray[tLength]+".json",
			dataType: 'json',
			async : false ,
			success: function(data){
				var dataArray = data;

				$.each(dataArray[0], function(k, v){
					if($.inArray(k, attArray) == -1){
						attArray.push(tArray[tLength]+"."+k);
					}
				});
			}
		});
	}
}

/* compute and display query results */
function ShowData(attribute, tArray, tLength, condition, aggregate){
	var conStrArray = condition.split("\"");
	var conArray = condition.split(" ");
	var indexMatch = [];

	if(conStrArray[1]!=null)
		conArray[2] = conStrArray[1];

	if(tArray[tLength] != ""){
		
		$.ajax({
			url: tArray[tLength]+".json",
			dataType: 'json',
			async : false ,
			success: function(data){
				var dataArray = data;

				$('.table').show();
				strData[tLength] = new Array(dataArray.length);
		
				if(condition != ""){		// 分析condition2 是否為值 或是其他table的attribute
					GetConditionData2(conArray[0], conArray[1], conArray[2], attribute, aggregate);	
					return ;
				}
				else{
					var sum = 0, max = 0, min = 0, avg = 0, count = 0 ;
					
					for(var i in dataArray){
						strData[tLength][i] = "";
						if(condition != ""){
							var matmp = 0;
							var con1 = GetConditionData1(conArray[0], attArray, dataArray[i], tArray[tLength]);
							var con2 = conArray[2].split(".");
							if(conArray[1] == "="){
								if(con2[0] == con1  ||  con2[0] == ("\""+con1+"\"") ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							else if(conArray[1] == "<"){
								if(con2[0] > con1 ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							else if(conArray[1] == "<="){
								if(con2[0] >= con1 ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							else if(conArray[1] == ">"){
								console.log("yoooooo");
								if(con2[0] < con1  ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							else if(conArray[1] == ">="){
								if(con2[0] <= con1 ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							else if(conArray[1] == "!="){
								if(con2[0] != con1  ||  con2[0] != ("\""+con1+"\"") ){
									indexMatch[matmp] = i;
									matmp ++;
								}	
							}
							
							var atArray = attribute.split(" , ");
							var aggregateArray = aggregate.split(" ");
							
							for(var m in indexMatch){
								console.log("indexmatch = "+indexMatch[m]);
								if(indexMatch[m] != null){
									for(var k in attArray){
										var attk = attArray[k].split(".");
										if(attribute.match("(.*)"+attk[1]+"(.*)") || attribute == "* "){
											strData[tLength][indexMatch[m]] += "<td class=\"center aligned\">"+dataArray[indexMatch[m]][attk[1]]+"</td>";
										}
									}
									indexMatch[m] = null;	
								}
							}
						}
						else{
							var atArray = attribute.split(" , ");
							var aggregateArray = aggregate.split(" ");
						
							// 先判斷是否有aggregate 
							if(aggregateArray == ""){
								for(var k in attArray){
									var attk  = attArray[k].split(".");
									for(var a in atArray){
										if( (atArray[a].match(attk[1])) || attribute == "* " ){
											console.log("yoo = "+dataArray[i][attk[1]]);
											if(tArray[tLength] == attk[0])
												strData[tLength][i] += "<td class=\"center aligned\">"+dataArray[i][attk[1]]+"</td>";
											else
												strData[tLength][i] += "<td class=\"center aligned\">undefined !</td>";		
										}
									}
								}
							}
							else{
							
								for(var k in attArray){
									var attk  = attArray[k].split(".");
									for(var a in atArray){
										
										if( (atArray[a].match(attk[1])) || attribute == "* " ){	
											if(aggregateArray[a] == "SUM"){							
												sum += dataArray[i][attk[1]];
										//		console.log("sum = "+sum);
												if(i==dataArray.length-1){
													console.log("test = "+sum);
													strData[tLength][i] += "<td class=\"center aligned\">"+sum+"</td>";
												}
												else 
													continue;
											}
											else if(aggregateArray[a] == "AVG"){							
												sum += dataArray[i][attk[1]];
												count++;
										//		console.log("sum = "+sum);
												if(i==dataArray.length-1){
													console.log("test = "+sum);
													strData[tLength][i] += "<td class=\"center aligned\">"+sum/count+"</td>";
												}
												else 
													continue;
											}
											else if(aggregateArray[a] == "COUNT"){							
									//			if(k%attArray.length == 0)
									//				countall++;
									//			console.log("countall = "+countall);
												if(i==dataArray.length-1){
													strData[tLength][i] += "<td class=\"center aligned\">"+dataArray.length+"</td>";
												}
												else 
													continue;
											}
											else if(aggregateArray[a] == "MAX"){
												if(i==0)
													max = dataArray[i][attk[1]];
											//	console.log("max = "+max);
												if(dataArray[i][attk[1]] > max)
													max = dataArray[i][attk[1]];
												if(i==dataArray.length-1){
													console.log("test = "+max);
													strData[tLength][i] += "<td class=\"center aligned\">"+max+"</td>";
												}
												else 
													continue;
											}
											else if(aggregateArray[a] == "MIN"){
												if(i==0)
													min = dataArray[i][attk[1]];
										//		console.log("min = "+min);
												if(dataArray[i][attk[1]] < min)
													min = dataArray[i][attk[1]];
												if(i==dataArray.length-1){
													console.log("test = "+min);
													strData[tLength][i] += "<td class=\"center aligned\">"+min+"</td>";
												}
												else 
													continue;
											}
										}
									}
								}
								
							}
							
						}					
						i++;
					}
				}
				
				var tmp = tArray.length -2 ;
				if((tLength) == tmp)
					ShowDataContent(attribute, attArray, strData, tArray);		
					
				},
			error: function (xhr, ajaxOptions, thrownError) {
				alert(xhr.status);
				alert(thrownError);
			}
		});
	}
};

/* Print data in html tag */
function ShowDataContent(attribute, attArray, strData, tArray){
	
	for(var i in attArray){
		var attk  = attArray[i].split(".");
		if(attribute.match("(.*)"+attk[1]+"(.*)") || attribute == "* "){
			document.getElementsByClassName("att")[0].innerHTML += "<th class=\"center aligned\">"+attArray[i]+"</th>";	
		}	
	}	
	for(var j in tArray){
		for(var k in strData[j])
			document.getElementsByClassName("att_val")[0].innerHTML += strData[j][k];
	}	
}

/* Clean html tag */
function CleanTable(){
	document.getElementsByClassName("att")[0].innerHTML = "";
	document.getElementsByClassName("att_val")[0].innerHTML = "";
};

function GetConditionData1(cond, attArray, getdata, table){
	for(var i in attArray){
		var attk = attArray[i].split(".");
		if(cond == attArray[i] && table == attk[0]){
			return getdata[attk[1]];
		}		
	}
};

/* The main processing query */
function GetConditionData2(con0Array, con1Array, con2Array, attribute, aggregate){
	console.log("c0 = "+con0Array);
	console.log("c1 = "+con1Array);
	console.log("c2 = "+con2Array);
	
	if(con2Array == null){
		console.log("table2");
		console.log(joinTable2);
		con1Array = "=";
	}
	else{
		console.log("table1");
		console.log(joinTable);
		nestedatt = attribute.trim();
	}
	
	var con0 = con0Array.split(".");
	var con1 = con1Array;
	if(con2Array != null)
		var con2 = con2Array.split(".");
	var atArray = attribute.split(" , ");
	var aggregateArray = aggregate.split(" ");
	var count = 0, notnested = 0;
	var joinNew = [];
	var sum = 0, max = 0, min = 0, avg = 0, count = 0;
	strData = [];
	
	/* it means nested(IN) */
	if(con2Array == null){
		for(var i=0 ; i<joinTable2.length ; i++){
			strData[count] = "";
			for(var j=0 ; j<joinTable.length ; j++){
			//	notnested = 0;
			//	for(var k in joinTable[j]){
					console.log("nested = "+nested);
					if(nested == 1){
						console.log("nestedatt ="+nestedatt);
						if(joinTable2[i][con0Array] == joinTable[j][nestedatt]){
							console.log("nestedatt = "+nestedatt);
							console.log("value = "+joinTable[j][nestedatt]);
							StoreStr(count, joinTable2[i]);
							count++;
						}
					}
					else if(nested == 2){				
						if(joinTable2[i][con0Array] != joinTable[j][nestedatt]){
							console.log("value = "+joinTable[j][nestedatt]);
			//				notnested++;
						//	console.log("notnested = "+notnested);
						//	console.log("joinTable[j].length = "+Object.keys(joinTable[j]).length);
			//				if(notnested == Object.keys(joinTable[j]).length){
								StoreStr(count, joinTable2[i]);
								count++;
			//				}
							
						}
					}
			//	}
				
				
			}
			
		}
	}
	else{
		for(var i in joinTable){
			strData[count] = "";
			
			// 判斷 condition2 是否為值 or att.value
			if(con2[1]!= null){
				if( con1Array=="=" && joinTable[i][con0Array] == joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array=="<" && joinTable[i][con0Array] < joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array=="<=" && joinTable[i][con0Array] <= joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array==">" && joinTable[i][con0Array] > joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array==">=" && joinTable[i][con0Array] >= joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array=="!=" && joinTable[i][con0Array] != joinTable[i][con2Array] ){
					StoreStr(count, joinTable[i]);
					count++;
				}

			}
			else{
				if(con1Array=="=" && joinTable[i][con0Array] == con2Array){
					console.log("yooo");
					StoreStr(count, joinTable[i]);
					count++;
				}else if( con1Array=="<" && joinTable[i][con0Array] < con2Array ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array=="<=" && joinTable[i][con0Array] <= con2Array ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array==">" && joinTable[i][con0Array] > con2Array ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array==">=" && joinTable[i][con0Array] >= con2Array ){
					StoreStr(count, joinTable[i]);
					count++;
				}
				else if( con1Array=="!=" && joinTable[i][con0Array] != con2Array ){
					StoreStr(count, joinTable[i]);
					count++;
				}

			//	console.log(strData);
			}
		}
	}
	
	/* store data in strData[], and push table in joinNew */
	function StoreStr(count, table){
	//	console.log(table);
	//	if($.inArray(table, joinNew) == -1){
	//		joinNew.push(table);
	//	}
		joinNew.push(table);

		if(aggregateArray == ""){
			for(var k in attArray){
				var attk = attArray[k].split(".");
				console.log("attribute = "+ attribute);
				console.log("att = "+attArray[k]);
			//	if( (attribute.match(attk[1])) || attribute == "* " ){
				if( (attribute.match(attArray[k])) || attribute == "* " ){
					strData[count] += "<td class=\"center aligned\">"+table[attArray[k]]+"</td>";
					console.log("strData = "+strData[count]);
				}	
			}
		}
	};
	console.log("joinNew");
	console.log(joinNew);
	joinTable = joinNew;
	console.log(strData);
	if(aggregateArray != ""){
		count = 0;
		for(var i in joinTable)
			AggregateStr(i);
	}
		
	
	/* Aggregate function */
	function AggregateStr(i){
		for(var k in attArray){
			var attk  = attArray[k].split(".");
			for(var a in atArray){
				
			//	if( (atArray[a].match(attk[1])) || attribute == "* " ){	
				if( (atArray[a].match(attArray[k])) || attribute == "* " ){	
					if(aggregateArray[a] == "SUM"){			
						console.log("i = "+i);
						console.log("value = "+ joinTable[i][attArray[k]]);
						sum += joinTable[i][attArray[k]];
						console.log("sum = "+sum);
					
						if(i==joinTable.length-1){
							console.log("test = "+sum);
							strData[i] += "<td class=\"center aligned\">"+sum+"</td>";
						}
						else 
							continue;
					}
					else if(aggregateArray[a] == "AVG"){							
						sum += joinTable[i][attArray[k]];
						count++;
				//		console.log("sum = "+sum);
						if(i==joinTable.length-1){
							console.log("test = "+sum);
							strData[i] += "<td class=\"center aligned\">"+sum/count+"</td>";
						}
						else 
							continue;
					}
					else if(aggregateArray[a] == "COUNT"){							
						if(i==joinTable.length-1){
							strData[i] += "<td class=\"center aligned\">"+joinTable.length+"</td>";
						}
						else 
							continue;
					}
					else if(aggregateArray[a] == "MAX"){
						if(i==0)
							max = joinTable[i][attArray[k]];
					//	console.log("max = "+max);
						if(joinTable[i][attArray[k]] > max)
							max = joinTable[i][attArray[k]];
						if(i==joinTable.length-1){
							console.log("test = "+max);
							strData[i] += "<td class=\"center aligned\">"+max+"</td>";
						}
						else 
							continue;
					}
					else if(aggregateArray[a] == "MIN"){
						if(i==0)
							min = joinTable[i][attArray[k]];
				//		console.log("min = "+min);
						if(joinTable[i][attArray[k]] < min)
							min = joinTable[i][attArray[k]];
						if(i==joinTable.length-1){
							console.log("test = "+min);
							strData[i] += "<td class=\"center aligned\">"+min+"</td>";
						}
						else 
							continue;
					}
				}
			}
		}
	}
	
	

	// print table
	document.getElementsByClassName("att")[0].innerHTML = "";		// initialize
	document.getElementsByClassName("att_val")[0].innerHTML = "";	// initialize
	
	for(var i in attArray){
		var attk  = attArray[i].split(".");
	//	if(attribute.match("(.*)"+attk[1]+"(.*)") || attribute == "* "){
		if(attribute.match(attArray[i]) || attribute == "* "){
			console.log("test");
			document.getElementsByClassName("att")[0].innerHTML += "<th class=\"center aligned\">"+attArray[i]+"</th>";	
		}	
	}	
	for(var k in strData){	
		document.getElementsByClassName("att_val")[0].innerHTML += strData[k];
	}
	
};

/* Implement Callback function */
function ShowTable(index,callback) {
	console.log("index = "+ index);
	
	$.ajax({
			url: tArray[tLength]+".json",
			dataType: 'json',
			async : true ,
			success: function(data){
				var dataArray = data;
				var attArray = [];
				
				$.each(dataArray[0], function(k, v){
					attArray.push(k);
					document.getElementsByClassName("att")[index].innerHTML += "<th>"+k+"</th>";
					});
				for(var i in dataArray){
					var str = "";
					for(var k in attArray){
					str += "<td>"+dataArray[i][attArray[k].toString()]+"</td>";
					}
					document.getElementsByClassName("att_val")[index].innerHTML += str;
					i++;
				}
						
			}
	});
	
	index++;
	if(index < 4)
		callback(index,callback);
};


