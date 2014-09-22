## Overview

As a KISSmetrics customer, I would like to be able to retrieve the details of a saved people search via an API. 

### Pre-requisites

* API access enabled
* Client API Key
* Client API Secret
* A saved _People Search_ report in the KISSmetrics UI. You will need the `guid` for this report.

### Endpoints

* `https://api.kissmetrics.com` will allow you to execute a saved report

### Libraries and Dependencies

* [`Faraday`](https://rubygems.org/gems/faraday)
* [`MultiJson`](https://rubygems.org/gems/multi_json)
* [`Typhoeus`](http://typhoeus.github.io)

## Ruby Example

Due to the asynchronous nature of our querying system this entails several steps.

### Setup the connection

In this example we are using [`faraday`](https://github.com/lostisland/faraday) to handle our _connection_ and _requests_.

```ruby
require 'faraday_middleware'
require 'typhoeus/adapters/faraday'
require 'multi_json'

connection = Faraday.new(url: ENV.fetch('API_ENDPOINT')) do |c|
  c.response(:logger, requests_log)
  c.adapter(:typhoeus)
end

# Be sure to set our content type to JSON
connection.headers['Content-Type']  = 'application/json'

# Retrieve JSON as the response
connection.headers['Accept']        = 'application/json'

# Authorization header to make requests
connection.headers['Authorization'] = "Bearer %s" % [ENV.fetch('API_KEY')]
```

### Initiate the initial query request

Now that we have a connection setup, we can use this to make the requests we need to initiate our query.

```ruby
query_params = {
  :report => {
    :start_date => ENV.fetch('REPORT_START_DATE'),
    :end_date   => ENV.fetch('REPORT_END_DATE')
  }
}

# Build the initial URL
report_url = "/query/reports/%s/run" % [ENV.fetch('REPORT_GUID')]

# Make the request
request = connection.post(report_url, MultiJson.dump(query_params))

case(request.status)
when(202)
  status_url = request.headers.fetch('location')
  
  query_params = {
    :limit   => ENV.fetch('RESULTS_LIMIT', 100)
  }
  
  # We need to check the returned Status for results. This will include the status and progress
  status_request = connection.get(status_url, query_params)
  
  case(status_request.status)
  when(200, 201)
    # Continue to loop and ping the status endpoint until it's completed or there is an error
    next_request = loop do
      poll_status_request  = connection.get(status_url, query_params)
      poll_status_response = MultiJson.load(poll_status_request.body)
    
      # Break if we are completed or there is an error
      break poll_status_request if poll_status_response['completed'] == true || (poll_status_response.has_key?('error') && !poll_status_response['error'].nil?)
    end
    
    case(next_request.status)
    when(201)
      # Status is completed and we have results URL to hit
      results_url = next_request.headers.fetch('location')
      
      results_request = connection.get(results_url, query_params)
      
      case(results_request.status)
      when(200)
        # We want to paginate all results and stitch them back together.
        rows = []

        results_response = MultiJson.load(results_request.body)

        rows.concat(results_response.fetch('rows', []))

        links     = results_response.fetch('links', [])
        next_link = links.select { |r| r['rel'] == 'next' }.first

        if next_link
          loop do
            logger.info("Retrieving paginated set %s" % [next_link['href']])

            results_request  = connection.get(next_link['href'])
            results_response = MultiJson.load(results_request.body)

            links     = results_response.fetch('links', [])
            next_link = links.select { |r| r['rel'] == 'next' }.first

            rows.concat(results_response.fetch('rows', []))
            break if next_link.nil?
          end
        end
      else
        # There was an error retrieving the results
      end
    else
      # There was an error with the status ping request
    end
  else
    # There was an error checking the status endpoint
  end
else
  # There was an error with the initial query request
end
```

There is quite a bit going on here, so let's break it down a little bit.

#### Initial Query Request and Response

If the initial request is successful, it will return a `202 Accepted` status code and:

```json
{
  "success": true, 
  "query_guid": "5f10fedc-4e21-4c04-a64b-66dd1d2d0fb2"
}
```

And it will include a `Location` header of `https://query.kissmetrics.com/v1/queries/5f10fedc-4e21-4c04-a64b-66dd1d2d0fb2/status`

If there is an error it will return:

```json
{
  "message": "Invalid report_guid provided: report not found.", 
  "error": "Not Found", 
  "status": 404
}
```

You will want to take the url from the `Location` header and _ping_ (`loop`) to check the status.

#### Status Request and Response

If the initial status request is successful, it will return a `200 OK` status code and:

```json
{
  "completed": false, 
  "progress": 0.483333333333333
}
```

You will continue pinging until you receive:

```json
{ 
  "completed": true, 
  "progress": 1.0
}
```

Once the criteria is met, you will receive a `201 Created` status code and a `Location` header of `https://query.kissmetrics.com/v1/queries/5f10fedc-4e21-4c04-a64b-66dd1d2d0fb2/results`

If there is an error in any part of this, there will be an `error` key in the status payload. This means you must break out of the loop if it is _completed_ or if the response body has an _error_ key.

#### Results Request and Response

You will utilize the `Location` header value from the successful status ping to turn around and retrieve your results.

> Note that subsequent requests to perform _pagination_ or _sorting_ will be done against this URL. You will not want to execute a new query.

If successful, you will receive a `200 OK` and the results:

```json
{
   "total":4396,
   "metadata":{
      "limit":2000,
      "offset":4000
   },
   "columns":[
      {
         "display_name":"KMID",
         "type":"internal",
         "return_option":"internal",
         "display_return_option":"internal"
      },
      {
         "display_name":"Person",
         "type":"internal",
         "return_option":"internal",
         "display_return_option":"internal"
      },
      {
         "display_return_option":"Total Times for Date Range",
         "display_name":"Commented",
         "type":"event",
         "return_option":"total_times"
      },
      {
         "display_return_option":"Total Times for Date Range",
         "display_name":"Tweet",
         "type":"event",
         "return_option":"total_times"
      },
      {
         "display_return_option":"Date of Last Time for Date Range",
         "display_name":"Tweet",
         "type":"event",
         "return_option":"last"
      }
   ],
   "rows":[
      [
         6998,
         "user@example.com",
         0,
         0,
         null
      ]
   ]
}
```
