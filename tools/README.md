
This is just a tool to check if multiple pods of RHSSO are getting requests *Cluster Domain* mode. 

To use this you need Python 2.7. 


### Usage

Before using this make sure you scale your RHSSO to at least 2 pods, then you can open a terminal to watch the logs of both pods as this script will generate traces in both.


```sh
./app.py [url_redhat_sso] [realm]
```

