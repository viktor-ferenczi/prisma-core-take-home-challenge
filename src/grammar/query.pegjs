Query = _? "PROJECT" _ columns:Columns _ "FILTER" _ condition:Condition _? {
	return {columns: columns, condition: condition};
}

Columns = names:Identifier|.., _? "," _?| {
	return names;
}

Condition = column:Identifier _? operator:Operator _? literal:(String / Integer) {
	return {column: column, operator: operator, literal: literal}
}

Operator = "=" / ">" {
	return text();
}

Identifier "identifier" = [a-zA-Z_][0-9a-zA-Z_]* {
	return text();
}

String = "\"" value:[^"]+ "\"" { return value.join(""); }

Integer = [0-9]+ { return BigInt(text()) }

_ "whitespace" = [ \t\n\r]+
