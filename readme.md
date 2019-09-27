#### Requirement:
    Nodejs      v10.16.3  
    Npm         6.9.0  
    MongoDB     4.2.0  
    PhantonJS   2.1.1


#### API:

#####WebCrawler:
    URL: /webcrawl
    Method: POST
    Headers: {
        "Content-Type": "application/json"
    }
    Body: {
        "domain": <website domain>
    }
    
#####Search: 
    URL: /search
    Method: GET
    Query: {
        q: <search query>
        page: <page> 
    }
    
    NOTE: By default this API only returns 10 records 
    
 