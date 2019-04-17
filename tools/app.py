#!/usr/bin/env python
import urllib2, ssl, sys

if len(sys.argv) < 2:
    print "Usage: testkc.py [rhsso-url] [realm]"
    exit()


default_url = "https://sso-testing-1.apps.tmagic-5e4a.openshiftworkshop.com"
url   = sys.argv[1]
realm = sys.argv[2]

print "URL:\033[0;32m", url
print "\033[0;0mREALM:\033[0;32m", realm
print "\n"

gcontext = ssl._create_unverified_context() 
auth_url = url + "/auth/realms/" + realm +"/protocol/openid-connect/auth?response_type=code"


print "\033[0;0m Auth against: ", auth_url

for i in range(0, 15):
    try:
        response = urllib2.urlopen(auth_url, context=gcontext)
        print response.info()
    except urllib2.HTTPError as e:
        print "hitting server"
    except urllib2.URLError as e:
        print "\033[1;31mIs the URL correct ?"
        print "Unexpected error: ", e.reason
        exit()

    print "calling: " , i 
