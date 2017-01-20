/**
 * Constructor of KissMetrics class
 *
 * @param string $apiKey
 */
function KissMetrics($apiKey) {
	this.apiKey = $apiKey;
	this.apiEndpoint = 'https://query.kissmetrics.com';
}

/**
 * Helper function to do an api call
 *
 * @param string $url
 * @param object $data Data to send
 * @param string $method POST or GET
 * @return XMLHttpRequest
 */
KissMetrics.prototype._apiRequest = function($url, $data, $method) {
	// Predefined static post data
	var $requestData = {
		'api_key': this.apiKey
	};
	// Merge predefined jsonData with user data
	if ($data) {
		for (var $i in $data) {
			$requestData[$i] = $data[$i];
		}
	}
	
	if ($method == 'GET') {
		var $dataArray = [];
		for (var $i in $requestData) {
			$dataArray.push($i + '=' + encodeURIComponent($requestData[$i]));
		}
		$url += '?' + $dataArray.join('&');

		var $xhr = new XMLHttpRequest();
		$xhr.open('GET', $url, false);
		$xhr.send();
	}
	else { 
		var $xhr = new XMLHttpRequest();
		$xhr.open($method || 'POST', $url, false);
		$xhr.setRequestHeader('Content-Type', 'application/json');
		$xhr.send(JSON.stringify($requestData));
	}
	
	return $xhr;
};

/**
 * Get a list of report entries
 *
 * @param int $startDate
 * @param int $endDate
 * @param string $reportID
 * @return array<array<mixed>>
 */
KissMetrics.prototype.getReports = function($startDate, $endDate, $reportID) {
	// Prepare request data
	var $url = this.apiEndpoint + '/v1/reports/' + $reportID + '/run';
	var $data = {
		'report': {
			'start_date': $startDate,
			'end_date': $endDate,
			'limit': 100000
		}
	}
	// Trigger the generation of our reports
	var $xhr = this._apiRequest($url, $data);
	var $location = $xhr.getResponseHeader('Location');
	if (!$location) {
		alert('Something went wrong on generating reports');
		return;
	}
	// Request the status of the generation process
	var $statusXhr = this._statusRequest($location);
	$location = $statusXhr.getResponseHeader('Location');
	if (!$location) {
		alert('Something went wrong on requesting the status');
		return;
	}
	// Download and return the report
	return this._downloadReports($location);
};

/**
 * Helper function to download the report rows
 *
 * @param string $location
 * @return array<array<mixed>>
 */
KissMetrics.prototype._downloadReports = function($location) {
	var $rows = [];
	while ($location) {
		// Request link list
		var $xhr = this._apiRequest($location, {}, 'GET');
		var $json = JSON.parse($xhr.responseText);
		// Check if we got an valid link list
		if (!$json || !$json.total) {
			alert('Something went wrong on downloading reports');
			return $rows;
		}
		$rows = $rows.concat($json.rows);
		$location = null;
		for (var $i = $json.links.length; $i--;) {
			if ($json.links[$i].rel == 'next') {
				$location = $json.links[$i].href;
				break;
			}
		}
	}
	return $rows;
};

/**
 * Helper function to check the report generation progress
 *
 * @param string $location
 * @return XMLHttpRequest
 */
KissMetrics.prototype._statusRequest = function($location) {
	// Maximum 50 tries to get complete status response
	for (var $i = 50; $i--;) {
		// Request report status
		var $statusMethod = this._apiRequest($location, {'limit': 1000}, 'GET');
		var $json = JSON.parse($statusMethod.getResponseBodyAsString());
		// Check if the response is correct and the report is completed
		if (!!$json && ($json.completed || $json.error)) {
			// Return success xhr
			return $statusMethod;
		}
	}
	return null;
};

// Create class instance with api key
$m = new KissMetrics('apiKey');
// Get report entries between start and end date for reportID
$rows = $m.getReports('1405288800', '1405375199', '9de21740-58d9-0131-5a89-22000ab4dcd7');

