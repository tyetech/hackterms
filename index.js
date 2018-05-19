
/* dependencies */
const http = require("http");
const fs = require("fs");                               // file system
const path = require("path");                           // access paths
const express = require("express");                     // express
var https = require('https');                           // enable https support
const MongoClient = require('mongodb').MongoClient;     // talk to mongo
const bodyParser = require('body-parser');              // parse request body
var session = require('express-session');               // create sessions
const MongoStore = require('connect-mongo')(session);   // store sessions in Mongo so we don't get dropped on every server restart
const bcrypt = require('bcrypt');                       // encrypt passwords

const app = express();
app.set("port", process.env.PORT || 3000)                        // we're gonna start a server on whatever the environment port is or on 3000
app.set("views", path.join(__dirname, "/public/views"));        // tells us where our views are
app.set("view engine", "ejs");                                  // tells us what view engine to use

app.use(express.static('public'));                              // sets the correct directory for static files we're going to serve - I believe this whole folder is sent to the user

const dbops = require("./app/dbops");
const database = require("./app/database");

var dbAddress;

if(process.env.LIVE){                                                                           // this is how I do config, folks. put away your pitforks, we're all learning here.
    dbAddress = "mongodb://" + process.env.MLAB_USERNAME + ":" + process.env.MLAB_PASSWORD + "@ds243325.mlab.com:43325/hackterms";
} else {
    dbAddress = "mongodb://localhost:27017/dictionary";
}

MongoClient.connect(dbAddress, function(err, db){
    if (err){
        console.log("MAYDAY! MAYDAY! Crashing.");
        return console.log(err);
    } else {

    }

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());                         // for parsing application/json

    var thisDb = db;

    var sessionSecret = process.env.SESSION_SECRET || "ejqjxvsh994hw8e7fl4gbnslvt3";

    app.use(session({                                
            secret: sessionSecret,             
            saveUninitialized: false,
            resave: false,
            secure: false,
            expires: null,
            cookie: {
                maxAge: null
            },
            store: new MongoStore({ 
                db: thisDb,
                ttl: 60*60*12,                  // in seconds - so, 12 hours total. Ths should hopefully expire and remove sessions for users that haven't logged in
                autoRemove: 'native'
            })
    }));

    app.use(function(req, res, next){                                           // logs request URL
        

        var timeNow = new Date();
        console.log("-----> " + req.method.toUpperCase() + " " + req.url + " on " + timeNow); 

/*        dbops.logVisit(db, req, function(){
            // console.log("visit logged");            
        }) */

        next();
    });

    app.use(function(req, res, next) {                                          
        
        if(req.session){
            app.locals.session = req.session;                                       // makes session available to all views <--- is this necessary/secure?
            app.locals.error = req.session.error;
            app.locals.message = req.session.message;
            req.session.message = null;
            req.session.error = null;
    
            if(req.session.user){                                                   // track whether a user is logged in
                req.session.loggedIn = true;
            } else {
                req.session.loggedIn = false;
            }

        }
        next();
    })

    app.use(function(req, res, next){

        // check if a user is logged in - fetch updated user data, or redirect to setting a username

        if(req.url != "/logout" && req.url != "/select-username" && req.session.user){
            if(typeof(req.session.user.username) != "undefined" && req.session.user.username != null){
                console.log("this user is logged in and has a username");
                console.log("getting updated user");
                dbops.getUpdatedUser(db, req, function moveOn(suspended){

                    if(suspended){
                        req.session.user = null;
                        req.session.expires = new Date(Date.now);       /* not sure if this is needed */
                    }

                    next();
                })
            } else {
                console.log("this user is logged in and DOES NOT have a username");
                res.render("selectUsername");
            }
        } else {
            console.log("User is not logged in - no need to fetch updated data");
            next();
        }
    });


/*    

    // emergency middleware to shut the site down to everyone but the user named "max" (err... me)


    app.use(function(req, res, next){                 
        if(req.session.user && req.session.user.username == "max"){ 
            next();

        } else {
            res.render("down");
        }
    })*/

/* ROUTES */

    app.get("/", function(req, res){
        console.log("getting /");
        res.render("index", {searchTerm: ""});
    });

    app.get("/about/faq", function(req, res){
        res.render("faq");
    });

    app.get("/about/darules", function(req, res){
        res.render("rules");
    });

    app.get("/about/all", function(req, res){
        dbops.getAllTerms(db, req, function renderTerms(allTerms){
            res.render("all", {terms: allTerms.terms});
        })
    });

    app.get("/about/changelog", function(req, res){
        res.render("changelog");
    });

    app.get("/about/press", function(req, res){
        res.render("press");
    });

    app.get("/all-terms", function(req, res){

        dbops.getAllTerms(db, req, function getTerms(allTerms){

            allTerms = allTerms.terms;
            var termNames = [];

            for(var i = 0; i < allTerms.length; i++){
                if(allTerms[i] != null){
                    termNames.push(allTerms[i].name);
                }
            }

            console.log(termNames);
            termNames.sort(function(a,b){return b.length - a.length})
            console.log(termNames);

            var loginStatus = false;
            var moderatorStatus = false;

            if(req.session.user){ loginStatus = true }      

            if(req.session.user){
                if(req.session.user.admin == "true" || req.session.user.moderator == "true" || req.session.user.admin == true || req.session.user.moderator == true){
                    moderatorStatus = true;
                }
            }

            res.send({status: "success", terms: termNames, isLoggedIn: loginStatus, isModerator: moderatorStatus});
        });
    })
    
    
    app.get("/metrics", function(req, res){

        if(req.session.user && req.session.user.username == "max"){
            dbops.getMetrics(db, req, function retrieveData(response){

                res.render("metrics", {
                    visitCount: response.visitCount,
                    userCount: response.userCount, 
                    users: response.users,
                    approvedDefinitions: response.approvedDefinitions,
                    unapprovedDefinitions: response.unapprovedDefinitions,
                    approvedDefinitionCount: response.approvedDefinitions.length,
                    unapprovedDefinitionCount: response.unapprovedDefinitions.length,
                    termCount: response.termCount,
                    searchCount:[],
                    newDefinitionCount: []
                });

            });

        } else {
            res.redirect("/");
        }
        
    });
/*
    app.get("/about/status", function(req, res){

        if(req.session.user && req.session.user.username == "max"){
            dbops.getMetrics(db, req, function retrieveData(response){

                res.render("metrics", {
                    visitCount: response.visitCount,
                    userCount: response.userCount, 
                    users: response.users,
                    approvedDefinitions: response.approvedDefinitions,
                    unapprovedDefinitions: response.unapprovedDefinitions,
                    approvedDefinitionCount: response.approvedDefinitions.length,
                    unapprovedDefinitionCount: response.unapprovedDefinitions.length,
                    termCount: response.termCount,
                    searchCount:[],
                    newDefinitionCount: []
                });

            });

        } else {
            res.redirect("/");
        }
        
    });*/

    app.post("/analytics", function(req, res){
        if(req.session.user && req.session.user.username == "max"){


            console.log("req.body");
            console.log(req.body);

            dbops.getAnalytics(db, req, function retrieveData(response){

                console.log("response");
                console.log(response);

                res.send({
                    status: "success",
                    searchCount: response.searchCount,
                    newDefinitionCount: response.newDefinitionCount
                });

            });

        } else {
            res.redirect("/");
        }
    })


    app.post("/search", function(req, res){
        dbops.search(db, req, function tryToSearch(response){
            if(response.status == "success"){

                var isLoggedIn = false;
                if(req.session.user){
                    isLoggedIn = true;
                }

                res.send({
                    status: "success",
                    count: response.count,
                    body: response.body,
                    loggedIn: isLoggedIn
                });

            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });


    app.post("/log-search", function(req, res){
        dbops.logSearch(db, req, function logSearch(){
            res.send({ status: "success" });
        });
    });


    app.get("/top-terms", function(req, res){
        dbops.getTopTerms(db, req, function logSearch(topTerms){
            res.send(topTerms);         // most requested and searched terms
        });
    });


    app.post("/get-definitions", function(req, res){

        console.log("GET DEFINITIONS POST:");
        console.log(req.body);
        dbops.getDefinitions(db, req, function getDefinitions(response){
            if(response.status == "success"){

                console.log("definition count: " + response.count);

                var loginStatus = false;
                var moderatorStatus = false;

                if(req.session.user){ loginStatus = true }      

                if(req.session.user){
                    if(req.session.user.admin == "true" || req.session.user.moderator == "true" || req.session.user.admin == true || req.session.user.moderator == true){
                        moderatorStatus = true;
                    }
                }

                var response = {
                    status: "success",
                    count: response.count,
                    body: response.body,
                    isLoggedIn: loginStatus,
                    isModerator: moderatorStatus
                }

                res.send(response);

            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });

    app.post("/new-definition", function(req, res){

        dbops.addDefinition(db, req, function confirmDefinition(response){
            if(response.status == "success"){
                res.send({ 
                    status: "success",
                    termAdded: response.termAdded,
                    term: response.term
                });

            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });

    app.post("/new-comment", function(req, res){

        dbops.addComment(db, req, function confirmComment(response){
            if(response.status == "success"){
                res.send({ 
                    status: "success",
                    comment: response.comment
                });

            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });

    app.post("/vote", function(req, res){
        dbops.vote(db, req, function vote(response){
            console.log("RESPONSE");
            console.log(response);
            if(response.status == "success"){
                res.send({
                    status: "success",
                    message: response.message,
                    definition: response.updatedDefinition
                });
            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });



     app.post("/get-comments", function(req, res){

        console.log("getting comments!");
        dbops.getComments(db, req, function getComments(response){
            if(response.status == "success"){

                console.log("comment count: " + response.count);

                var loggedIn = false;

                console.log("session.user");
                console.log(req.session.user);


                if(req.session.user){
                    console.log("Getting comments for a user who's logged in");
                    loggedIn = true;
                }


                res.send({
                    status: "success",
                    count: response.count,
                    comments: response.body,
                    isLoggedIn: loggedIn
                });

            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });






    /* ACCOUNT */


    app.post("/signup", function(req, res){
        dbops.signup(db, req, function vote(response){
            if(response.status == "success"){
                res.send({
                    status: "success",
                    message: response.message
                });
            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    message: response.message,
                    errorType: response.errorType
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });

    app.post("/login", function(req, res){
        dbops.login(db, req, function login(response){

            if(response.status == "fail"){
                res.send({
                    status: "fail",
                    message: response.message,
                    errorType: response.errorType
                });
            } else {
                //res.render("index")
                res.send({ status: "success" });
            }
        });
    });

    app.post("/google-login", function(req, res){
        if(req.session.user){
            console.log("Already logged in");
            res.send({status: "logged in" });
        } else {
            dbops.googleLogin(db, req, function sendUserData(response){
                if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        message: response.message,
                        errorType: response.errorType
                    });
                } else {
                    res.send({ status: "success" });
                }
            })
        }
    })



    app.post("/github-login", function(req, res){

        "https://github.com/login/oauth/authorize?scope=user:email&client_id=029b90872503557c3d0e"






    });



    app.get("/github-oauth", function(req, res){

        if(req.session && req.session.user && req.session.loggedIn){
            console.log("Already logged in");
            res.send({status: "logged in" });
        } else {

            console.log(req.query);
            var code = req.query.code;
            console.log("got github code:" + code);
            //res.send({status: "not logged in" });

            dbops.githubLogin(db, req, code, function talkToGithub(response){

                console.log("github login response");
                console.log(response);

                if(response.status == "fail"){
                    console.log("failing - rendering index");
                    req.session.error = response.message;
                    res.render("index", { searchTerm: "", message: "Account created. Log in with Github!"});
                    // res.redirect("/");

                } else {
                    if(response.status == "account created"){
                        res.render("index", { searchTerm: "", message: "Account created. Log in with Github!"});
                    } else if(response.status == "logged in"){
                        res.redirect("/");
                    }  else {
                        res.render("index", { searchTerm: "", error: "Account created, then something weird happened."});
                    }
                }
            })   
        }
    });


    app.get("/logout", function(req, res){
        req.session.destroy();   
        res.redirect("/");
    })

    app.get("/profile", function(req, res){
        if(req.session.user){
            res.redirect("/profile/" + req.session.user.username + "/definitions");
        } else {
            res.redirect("/");
        }
    })

    app.get("/profile/status", function(req, res){
        if(req.session.user){
            res.redirect("/profile/" + req.session.user.username + "/status");
        } else {
            res.redirect("/")
        }
    })

    app.get("/profile/:username", function(req, res){
        res.redirect("/profile/" + req.params.username + "/definitions");
    })

    app.get("/profile/:username/views/components/:component", function(req, res){

        console.log("WE WANT A COMMENT!");

        if(req.params.component == "comment.html"){
            res.send("components/comment.html")
        } else if(req.params.component == "comment.html"){
                // ??
        }
    })

    app.get("/profile/:username/:section", function(req, res){
        

        console.log("req.params");
        console.log(req.params);

        var fullProfile = false;
        var moderator = false;

        if(req.session.user && (req.session.user.admin == "true" || req.session.user.moderator == "true" || req.session.user.admin == true || req.session.user.moderator == true)){
            moderator = true;
        }

        if(req.session.user){
            if((req.session.user.username == req.params.username) || moderator){
                fullProfile = true;
            }
        }


        var profile = "profile/definitions";            // this takes care of typos and defaults to the definitions page

        if(req.params.section == "comments"){ profile = "profile/comments"; }
        if(req.params.section == "status" && fullProfile){ profile = "profile/status"; }

        if(req.params.section == "definitions" || req.params.section == "comments" || req.params.section == "status"){
            dbops.getUserData(db, req, req.params.username, function getData(response){
                if(response.status == "success"){
                    if(req.session.user && req.params.username.trim() == req.session.user){
                        res.render(profile, {definitions: response.definitions, notifications: response.notifications, username: req.session.user.username, comments: response.comments, displayFullProfile: fullProfile});
                    } else {
                        res.render(profile, {definitions: response.definitions, username: req.params.username, comments: response.comments, displayFullProfile: fullProfile});
                    }   
                } else {
                    req.session.error = "Something strange happened"; 
                    res.redirect("/");
                }   
            });
        } else {
            res.redirect("/");
        }

        

    })

    app.get("/updated-user-data", function(req, res){
        if(req.session.user){

            dbops.getUserData(db, req, req.session.user.username, function getData(response){
                console.log(response);
                if(response.status == "success"){
                    res.send({status: "success", definitions: response.definitions, notifications: response.notifications, comments: response.comments});
                } else {
                    res.send({
                        status: "fail",
                        error: "Something strange happened"
                    })
                }   
            });
        } else {
            res.redirect("/");
        }
    })


/* ADMIN PAGES */

    app.get("/admin", function(req, res){
        if(req.session.user && (req.session.user.admin == "true" || req.session.user.admin == true || req.session.user.moderator == "true"|| req.session.user.moderator ==  true )){
            console.log("user is a moderator or admin");
            res.render("admin");
        } else {
            console.log("not admin");
            console.log("Logged in: " + req.session.user);
            res.redirect("/");
        }
    })

    app.get("/get-role-editor-modal", function(req, res){
        if(req.session.user && (req.session.user.admin == "true" || req.session.user.admin == true)){
            console.log("admin request approved");
            res.render("modals/roleEditorModal");
        } else {
            res.send({
                status: "fail",
                error: "This page is not available"
            })
        }
    })

    app.get("/get-add-definition-modal", function(req, res){
        if(req.session.user){
            res.render("modals/addDefinitionModal");
        } else {
            res.render("modals/signupAndLoginModal")
        }
    })

    app.post("/new-report", function(req, res){
        dbops.addReport(db, req, function report(response){
            if(response.status == "success"){
                res.send({
                    status: "success",
                    message: response.message
                });
            } else if(response.status == "fail"){
                res.send({
                    status: "fail",
                    error: response.message
                });
            } else {
                res.send({
                    status: "fail",
                    error: "Something strange happened"
                })
            }   
        });
    });

    app.get("/admin-data", function(req, res){
        if(req.session.user && (req.session.user.admin || req.session.user.moderator)){
            dbops.getAdminData(db, req, function prepAdminData(rawAdminData){

                adminData = {
                    reports: rawAdminData.reports,
                    definitions: rawAdminData.definitions
                }   

                res.send({status: "success", data: adminData});
            })
        } else {
            res.send({
                status: "fail",
                error: "Not an admin or moderator"
            })
        }
    });

    app.post("/admin-vote", function(req, res){
        
        if(req.session.user && (req.session.user.admin || req.session.user.moderator)){
            dbops.adminVote(db, req, function vote(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        message: response.message
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                } else {
                    res.send({
                        status: "fail",
                        error: "Something strange happened"
                    })
                }   
            });
        } else {
            res.send({
                status: "fail",
                error: "Not an admin or moderator"
            })
        }
    });

    app.post("/user-roles", function(req, res){
        
        if(req.session.user && req.session.user.admin){
            dbops.getUserRoles(db, req, function vote(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        message: response.message,
                        roles: response.roles
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                }
            });
        } else {
            res.send({
                status: "fail",
                error: "Not an admin"
            })
        }
    });

    app.post("/update-user-roles", function(req, res){
        
        if(req.session.user && req.session.user.admin){
            dbops.updateUserRoles(db, req, function vote(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        message: response.message,
                        roles: response.roles
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                }
            });
        } else {
            res.send({
                status: "fail",
                error: "Not an admin"
            })
        }
    });

    app.post("/clear-notifications", function(req, res){
        
        if(req.session.user){
            dbops.clearNotifications(db, req, function vote(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        message: response.message,
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                }
            });
        } else {
            res.send({
                status: "fail",
                error: "Something went wrong"
            })
        }
    });

    app.post("/delete-post", function(req, res){
        
        if(req.session.user){
            dbops.deletePost(db, req, function deletePost(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        message: response.message,
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                }
            });
        } else {
            res.send({
                status: "fail",
                error: "You must be logged in to delete posts"
            })
        }
    });

    app.post("/get-existing-post", function(req, res){
        
        if(req.session.user){
            dbops.getExistingDefinition(db, req, function deletePost(response){
                if(response.status == "success"){
                    res.send({
                        status: "success",
                        post: response.post,
                    });
                } else if(response.status == "fail"){
                    res.send({
                        status: "fail",
                        error: response.message
                    });
                }
            });
        } else {
            res.send({
                status: "fail",
                error: "You must be logged in to edit a post"
            })
        }
    });


    app.post("/password-reset-request", function(req, res){
        dbops.passwordResetRequest(db, req, function confirmReset(response){
            res.send({status: response.status, message: response.message});
        });

    });

    app.get("/password-reset/:id", function(req, res){
        dbops.checkPasswordReset(db, req, function confirmReset(response){
            
            if(response.status == "success")
                res.render("password-reset.ejs", {token: req.params.id});
            else {
                req.session.error = "This password reset request has expired. Please request another password reset."
                res.redirect("/");
            }
        });
    });

    app.post("/password-reset", function(req, res){
        dbops.passwordResetAction(db, req, function confirmReset(response){
            
            if(response.status == "success")
                res.send({status: "success"});
            else {
                res.send({ status: "fail", message: response.message })
            }
        });
    });

    app.post("/select-username", function(req, res){
        console.log("selecting username");
        dbops.selectUsername(db, req, function pickUsername(response){
            console.log("got response from dbops");
            console.log(response);
            if(response.status == "success")
                res.send({status: "success"});
            else {
                res.send({ status: "fail", message: response.message })
            }
        });
    });

    app.post("/request-definition", function(req, res){
        dbops.requestDefinition(db, req, function confirmReset(response){
            
            if(response.status == "success")
                res.send({status: "success"});
            else {
                res.send({ status: "fail", message: response.message })
            }
        });
    });

    app.get("/random-term", function(req, res){
        dbops.getRandomTerm(db, req, function randomTerm(term){
            res.redirect("/" + term);
        });
    });


    app.post("/restore-database", function(req, res){

        if(req.session.user && req.session.user.username == "max"){
            dbops.fillInTerms(db, req, function retrieveData(response){

                if(response.status == "success"){
                    res.redirect("/")
                } else {
                    res.render("inded", {error: response.message})
                }
            })
        }
    })

    app.post("/get-empty-terms", function(req, res){

        if(req.session.user && req.session.user.username == "max"){
            dbops.getEmptyTerms(db, req, function getTerms(response){

                if(response.status == "success"){
                    res.redirect("/")
                } else {
                    res.render("inded", {error: response.message})
                }
            })
        }
    })




    // putting this last to make sure we don't overwrite any other routes

    // alternatively, can say "if term != profile, etc... "

    app.get("/:term", function(req, res){
        console.log(req.params.term);
        res.render("index", {searchTerm: req.params.term, title: "Hackterms: " + req.params.term});
    });

/*    app.get("/term/:term", function(req, res){            // add this soon
        res.redirect("/term/" + req.params.term)
    });*/






/* END ROUTES */


    /* 404 */

    app.use(function(req, res) {
        res.status(404);
        req.session.error = "404 - page not found!";
        res.redirect("/");
    });

    app.listen(app.get("port"), function() {
        console.log("Server started on port " + app.get("port"));
    });
});

