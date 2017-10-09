# Goodreads Viewer

## Purpose
I really enjoy using [Goodreads.com](https://www.goodreads.com/) to keep track of the books that I have read and want to read. One of the things I use it for most often is to find what I want to read next. That often depends on price and availability. The problem is that Goodreads does not display this information in-line with the list items. Instead, you have to click through for every book you think you *might* want to read to find its price and a link to buy it. I created this entirely front-end tool to do this.

## Usage
To really use this, you need to have API keys. This app uses two APIs: the [Goodreads API](https://www.goodreads.com/api) and [Amazon's Product Advertising API](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/Welcome.html). Because this is a front-end app, I unfortunately could not include my own in this repository. Getting a Goodreads API key is not difficult, but unfortunately getting the Amazon keys is a bit of a bother. My apologies.

You will further need to use the [CORS extension](https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi) on Chrome (or a similar extension if using in other browsers).

## Why front-end only?
This was completed as a school project to showcase front-end development using APIs. I plan to revisit it and give it a proper back-end when I can. That will remove the need for adding your own API keys and CORS muckity-muck.

## Link
#### [Goodreads Viewer](http://goodreads-viewer.surge.sh/)
Keep in mind, this is a stunted version with no Amazon integration (see "Usage" above).
