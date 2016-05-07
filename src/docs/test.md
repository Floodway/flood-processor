# Namespace: test

 --- 
##Middleware

###deny 
Requests with this middleware will never succeed

 --- 

####Parameters
 json```{}```
####Possible errors 
**nope**
	*Something went wrong!Nope!*##Actions

* ###helloWorld 

	*Prints out hello world*
	* **Supports updates:** No 
	* **Parameters:**

 		```json
		{}
```
	* **Possible errors**:
None
* ###store 

	*Stores a value in the session*
	* **Supports updates:** No 
	* **Parameters:**

 		```json
		{
		    "name": {
		        "type": "string"
		    }
		}
```
	* **Possible errors**:
None
* ###retrieve 

	*Retrieves a value stored beforehand*
	* **Supports updates:** No 
	* **Parameters:**

 		```json
		{}
```
	* **Possible errors**:
None
