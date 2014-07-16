var apiKey = 'apiKey';
var apiEndpoint = 'https://query.kissmetrics.com';
var startDate = 1405288800;
var endDate = 1405375199;
var reportID = '9de21740-58d9-0131-5a89-22000ab4dcd7';

/**
 * Helper function to do an api call
 *
 * @param string url
 * @param object data Data to send
 * @param string method POST or GET
 * @return XMLHttpRequest
 */
function _apiRequest(url, data, method) {
	// Predefined static post data
	var requestData = {
		'api_key': apiKey
	};
	// Merge predefined jsonData with user data
	if (data) {
		for (var i in data) {
	   			requestData[i] = data[i];
		}
	}
	var httpMethod = null;
	if (method == 'GET') {
		var dataArray = [];
		for (var i in requestData) {
			dataArray.push(i + '=' + encodeURIComponent(requestData[i]));
		}
		url += '?' + dataArray.join('&');

		httpMethod = new Packages.org.apache.commons.httpclient.methods.GetMethod(url);
		httpMethod.addRequestHeader('Content-Type', 'application/json');
	}
	else {
		httpMethod = new Packages.org.apache.commons.httpclient.methods.PostMethod(url);
		httpMethod.addRequestHeader('Content-Type', 'application/json');
		httpMethod.setRequestBody(JSON.stringify(requestData));
	}

	var httpClient = new Packages.org.apache.commons.httpclient.HttpClient();
	httpClient.setConnectionTimeout(0);
	httpClient.setTimeout(0);
	var http_status_code = httpClient.executeMethod(httpMethod);
	
	return httpMethod;
};

function _downloadReports(location) {
	var rows = [];
	while (location) {
		// Request link list
		var method = _apiRequest(location, {}, 'GET');
		var json = JSON.parse(method.getResponseBodyAsString());
		// Check if we got an valid link list
		if (!json || !json.total) {
			return rows;
		}
		rows = rows.concat(json.rows);
		location = null;
		for (var i = json.links.length; i--;) {
			if (json.links[i].rel == 'next') {
				location = json.links[i].href;
				break;
			}
		}
	}
	return rows;
};

function _statusRequest(location, limit) {
	// Maximum 50 tries to get complete status response
	for (var i = 50; i--;) {
		// Request report status
		var statusMethod = _apiRequest(location, {'limit': limit || 100}, 'GET');
		return statusMethod;
		var json = JSON.parse(statusMethod.getResponseBodyAsString());
		// Check if the response is correct and the report is completed
		if (!!json && (json.completed || json.error)) {
			// Return success xhr
			return statusMethod;
		}
	}
	return null;
};


// Prepare request data
var url = apiEndpoint + '/v1/reports/' + reportID + '/run';
var data = {
	'report': {
		'start_date': startDate,
		'end_date': endDate,
		'limit': 100000
	}
}
// Trigger the generation of our reports
var method = _apiRequest(url, data);
var location = method.getResponseHeader('Location').getValue();
// Request the status of the generation process
var statusMethod = _statusRequest(location);
location = statusMethod.getResponseHeader('Location').getValue();
// Download and return the report
var rows = JSON.stringify(_downloadReports(location));

