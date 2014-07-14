## People Search API Example Script

Utilize the KISSmetrics People Search Query API to retrieve results.

## Overview

This is an example script written in `ruby` that shows how to execute a
**People Search** API Query. The queries are _asynchronous_ and require
several steps to retrieve all results.

* Initiate the query(`/run`)
* Ping the status (`/status`)
* Retrieve the results (`/results`)
* Inspect and paginate with the `next` link in the `links` body to build
the entire `rows` collection.

This script will also:

* Output the results to a `CLI` view.
* Store a cached `JSON` output in `/cache`
* Store a cached `CSV` output in `/cache`

You can inspect all activities via the logs:

View all HTTP requests:

```
tail -f log/requests.log
```

View the script logging:

```
tail -f log/development.log
```

## Usage

You must first specify the necessary `ENV` variables in `.env`. We have
provided a sample file. You can copy this and provide your information:

```
cp .env.sample .env
```

You will need to specify the following:

* `API_KEY`: This is your API Key you receive from KISSmetrics.
* `API_ENDPOINT`: This is the API endpoint, and will be `https://query.kissmetrics.com` for your usage.
* `REPORT_GUID`: To find your Report GUID, go to
[your reports page](https://app.kissmetrics.com/reports), and _View
Source_ or _Inspect Element_ on the People Report you wish to query.
* `REPORT_START_DATE`: This is the **UNIX Timestamp** of the start date.
* `REPORT_END_DATE`: This is the **UNIX Timestamp** of the end date.
* `RESULTS_LIMIT`: You can modify this to change the `limit` in the query itself.

Once these are in place, you can execute the script with:

```
bundle exec bin/people_search
```

> You can view a [detailed breakdown in the /bin
README](https://github.com/kissmetrics/example-people-search/tree/master/bin)

This will kick off the script to execute your specified People Search
Report. Once the report is finished, you should see a table format on
the command line. You will also have cached files in:

* `cache/results.json`
* `cache/results.csv`

### Example JSON

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

### Example CSV

```csv
KMID (internal),Person (internal),Commented (Total Times for Date Range),Tweet (Total Times for Date Range),Tweet (Date of Last Time for Date Range)
6998,user@example.com,0,0,
```
