
let headers = "";
let companies = [];

class CompanyData {
	constructor(name, companyName, price, change, chgPercentage, marketCap) {
		this.name = name;
		this.companyName = companyName;
		this.price = price;
		this.change = parseFloat(change);
		this.chgPercentage = chgPercentage;
		this.marketCap = marketCap;
		this.previousDelta = new Delta(0, 0, 0)
	}

	update(delta) {
		this.previousDelta = new Delta(this.price, this.change, this.chgPercentage)
		this.price = delta.price;
		this.change = delta.change;
		this.chgPercentage = delta.percentage;

	}
}

class Delta {
	constructor(price, change, percentage) {
		this.price = price;
		this.change = parseFloat(change);
		this.percentage = percentage;
	}
}

// global event listener, selecting inputs by element id
document.addEventListener("DOMContentLoaded", () => {	//global event listener, doesn't do anything till the page is loaded

	let snapshot = document.getElementById("snapshot-file-input");
	let deltas = document.getElementById("deltas-file-input");
	snapshot.addEventListener("change", (event) => readSnapshotCsv(event));
	deltas.addEventListener("change", (event) => readDeltasCsv(event));

});
//-------------------------------------------------------------------

// Loading the files into a FileReader and converting the data to text. 
function readSnapshotCsv(event) {
	let files = event.target.files;

	let fileReader = new FileReader();

	fileReader.onload = OnLoadSnapshot;
	fileReader.readAsText(files[0]);
}
//---------------------------------------------------------------------

// parse the snapshot file into an objects, then into a table. 
function OnLoadSnapshot(event) {
	let result = event.target.result; // The target property returns the element where the event occured.
	let lines = result.split("\r\n");
	headers = lines[0];
	lines = lines.slice(1, lines.length); // remove the header line. 

	companies = [];

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		if (line === "") continue;

		seperateData = line.split(",");

		let companyData = new CompanyData( //map the data to the company data class
			seperateData[0],
			seperateData[1],
			seperateData[2],
			seperateData[3],
			seperateData[4],
			seperateData[5]
		);
		companies.push(companyData); // push company data into the array
	}

	let table = document.querySelector("table");
	generateTableData(table, companies);
	generateTableHead(table);

}
//---------------------------------------------------------------------

// Target files, new FileReader and convert to text. 
function readDeltasCsv(event) {
	let files = event.target.files;

	let fileReader = new FileReader();
	fileReader.onload = OnLoadDeltas;
	fileReader.readAsText(files[0]);
}
//---------------------------------------------------------------------

// Split lines before recursion.
function OnLoadDeltas(event) {
	let result = event.target.result;
	let lines = result.split("\r\n");

	updateDeltas(lines, 0)
}
//-------------------------------------------------------------------

// iterate over deltas until the end of the batch. Then update the table and set delay for the next batch.  
function updateDeltas(lines, index) { //recursive 
	let deltas = [];
	let delay = 0;

	if (index >= lines.length - 1) index = 0; // restart at the top of the file, once end is reached.

	while (delay === 0) {

		let line = lines[index];

		if (line === "") continue;

		let singleValues = line.split(",");

		if (singleValues[0] !== "") { //!== does not equal 
			delay = parseInt(singleValues[0]);
			index++;
			break;
		}

		let delta = new Delta(singleValues[2], singleValues[3], singleValues[4]);
		deltas.push(delta);
		index++;
	}

	let table = document.querySelector("table");

	for (let i = 0; i < companies.length; i++) {
		let company = companies[i];
		let delta = deltas[i];
		table.deleteRow(-1);
		if (delta.price === "") continue;

		company.update(delta);

	}
	generateTableData(table, companies);
	setTimeout(() => updateDeltas(lines, index), delay);
}
//-------------------------------------------------------------------

// Generate table head, rows and import data. Changing elements to 'th' to make it more accessible for CSS.  
function generateTableHead(table) {
	let tHeader = table.createTHead();
	let row = tHeader.insertRow();
	let headersArray = headers.split(",");

	for (let i = 0; i < headersArray.length; i++) {	 //if the index is less than the header length, run the loop

		let head = headersArray[i];
		let th = document.createElement("th");
		let text = document.createTextNode(head);

		th.appendChild(text);
		row.appendChild(th);
	}
}
//-----------------------------------------------------------------

// Assigns data to cells within the Table Rows. 
function generateTableData(table, companyData) {
	for (let i = 0; i < companyData.length; i++) {
		let company = companyData[i];
		let row = table.insertRow();

		let priceChange = "generateTableData__increase";

		if (company.change < company.previousDelta.change)
			priceChange = "generateTableData__decrease"

		row.insertCell().innerHTML = company.name;
		row.insertCell().innerHTML = `<div class = "generateTableData__bubble"> ${company.companyName} <div/>`
		row.insertCell().innerHTML = company.price;
		row.insertCell().innerHTML = `<div class = "${priceChange}"> ${company.change} </div>`
		row.insertCell().innerHTML = company.chgPercentage;
		row.insertCell().innerHTML = company.marketCap;
	}
	table.tBody
}
//------------------------------------------------------------------