# 2014-09-07

Bug Fixes:

* Remove the need and use of _webhooks_

Features:

* Change Branched Funnel validation
    * The branched funnel now only accepts a single event per node.
      Change validation to reflect this change
* Multi Column Name support
    * Adds collection based `metadata` and `columns` titles, as well as reformatting `rows` to return in a flattened array.
* Adds **Pagination** to response.
    * Payload now has a `links` envelope to traverse results. Links include `self`, `first`, `next`, `prev`, `last`.
* Adds `return_option` and `display_return_option` to response `columns`
