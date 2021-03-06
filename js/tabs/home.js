SharkGame.Home = {

    tabId: "home",
    tabDiscovered: true,
    tabName: "Home Sea",

    homeMessage: "You are a shark in a strange blue sea.",
    currentExtraMessageIndex: -1,

    // Priority: later messages display if available, otherwise earlier ones.
    extraMessages: [
        {
            message: "&nbsp<br/>&nbsp"
        },
        {
            unlock: {resource: {fish: 5}},
            message: "You attract the attention of some sharks. Maybe they can help you catch fish!<br/>&nbsp"
        },
        {
            unlock: {resource: {fish: 15}},
            message: "Some rays drift over.<br/>&nbsp"
        },
        {
            unlock: {resource: {shark: 1, ray: 1}},
            message: "You have quite the group going now.<br/>&nbsp"
        },
        {
            unlock: {resource: {shark: 4, ray: 4}},
            message: "Some curious crabs come over.<br/>&nbsp"
        },
        {
            unlock: {resource: {shark: 1, ray: 1, crab: 1}},
            message: "Your new tribe is at your command!<br/>&nbsp"
        },
        {
            unlock: {resource: {shark: 1, crystal: 10}},
            message: "The crystals are shiny. Some sharks stare at them curiously.<br/>&nbsp"
        },
        {
            unlock: {resource: {scientist: 1}},
            message: "The science sharks swim in their own school.<br/>&nbsp"
        },
        {
            unlock: {upgrade: ["crystalContainer"]},
            message: "More discoveries are needed.<br/>&nbsp"
        },
        {
            unlock: {resource: {nurse: 1}},
            message: "The shark community grows with time.<br/>&nbsp"
        },
        {
            unlock: {upgrade: ["exploration"]},
            message: "You hear faint songs and cries in the distance.<br/>&nbsp"
        },
        {
            unlock: {upgrade: ["automation"]},
            message: "Machines to do things for you.<br/>Machines to do things faster than you or any shark."
        },
        {
            unlock: {upgrade: ["farExploration"]},
            message: "This place is not your home. You remember a crystal blue ocean.<br/>The chasms beckon."
        },
        {
            unlock: {upgrade: ["gateDiscovery"]},
            message: "The gate beckons. The secret must be unlocked.<br/>&nbsp"
        }
    ],

    init: function() {
        var h = SharkGame.Home;
        // register tab
        SharkGame.Tabs[h.tabId] = {
            id: h.tabId,
            name: h.tabName,
            discovered: h.tabDiscovered,
            code: h
        };
    },

    switchTo: function() {
        var h = SharkGame.Home;
        var content = $('#content');
        var tabMessage = $('<div>').attr("id", "tabMessage");
        content.append(tabMessage);
        h.currentExtraMessageIndex = -1;
        h.updateMessage(true);
        var helpButtonDiv = $('<div>');
        helpButtonDiv.css({margin: "auto", clear: "both"});
        SharkGame.Button.makeButton("helpButton", "&nbsp Toggle descriptions &nbsp", helpButtonDiv, h.toggleHelp).addClass("min-block");
        content.append(helpButtonDiv);
        content.append($('<div>').attr("id", "buttonList"));
    },

    updateMessage: function(suppressAnimation) {
        var h = SharkGame.Home;
        var r = SharkGame.Resources;
        var u = SharkGame.Upgrades;
        var selectedIndex = h.currentExtraMessageIndex;
        $.each(h.extraMessages, function(i, v) {
            var showThisMessage = true;
            // check if should show this message
            if(v.unlock) {
                if(v.unlock.resource) {
                    $.each(v.unlock.resource, function(k, v) {
                        showThisMessage = showThisMessage && (r.getResource(k) >= v);
                    });
                }
                if(v.unlock.upgrade) {
                    $.each(v.unlock.upgrade, function(i, v) {
                        showThisMessage = showThisMessage && u[v].purchased;
                    });
                }
            }
            if(showThisMessage) {
                selectedIndex = i;
            }
        });
        // only edit DOM if necessary
        if(h.currentExtraMessageIndex !== selectedIndex) {
            h.currentExtraMessageIndex = selectedIndex;
            var tabMessage = $('#tabMessage');
            var message = h.homeMessage;
            message += "<br/><span class='medDesc'>" + h.extraMessages[selectedIndex].message + "</span>";

            if(!suppressAnimation && SharkGame.Settings.current.showAnimations) {
                tabMessage.animate({opacity: 0}, 100, function() {
                    var thisSel = $(this);
                    thisSel.html(message)
                        .animate({opacity: 1}, 100);
                })
            } else {
                tabMessage.html(message);
            }
        }
    },

    update: function() {
        var h = SharkGame.Home;
        var r = SharkGame.Resources;
        var amountToBuy = SharkGame.Settings.current.buyAmount;

        // cache a selector
        var buttonList = $('#buttonList');

        // for each button entry in the home tab,
        $.each(SharkGame.HomeActions, function(key, value) {
            // check if a button exists
            var button = $('#' + key);
            var helpText;
            if(button.length === 0) {
                // add it if prerequisites have been met
                var prereqsMet = true; // assume true until proven false

                // check resource prerequisites
                if(value.prereq.resource) {
                    prereqsMet = prereqsMet && r.checkResources(value.prereq.resource);
                }

                // check upgrade prerequisites
                if(value.prereq.upgrade) {
                    $.each(value.prereq.upgrade, function(_, v) {
                        prereqsMet = prereqsMet && SharkGame.Upgrades[v].purchased;
                    });
                }

                if(prereqsMet) {
                    // add button
                    var buttonSelector = SharkGame.Button.makeButton(key, value.name, buttonList, h.onHomeButton);

                    if(SharkGame.Settings.current.showAnimations) {
                        buttonSelector.hide()
                            .css("opacity", 0)
                            .slideDown(50)
                            .animate({opacity: 1.0}, 50);
                    }
                }
            } else {
                // button exists
                // disable or enable button based on cost being met
                var amount = amountToBuy;
                var actionCost;
                if(amountToBuy < 0) {
                    var max = h.getMax(value);
                    var divisor = Math.floor((amountToBuy)) * -1;
                    amount = (max / divisor);
                    if(amount < 1) amount = 1;
                    actionCost = h.getCost(value, amount);
                } else {
                    actionCost = h.getCost(value, amountToBuy);
                }
                // disable button if resources can't be met
                var enableButton;
                if($.isEmptyObject(actionCost)) {
                    enableButton = true; // always enable free buttons
                } else {
                    enableButton = r.checkResources(actionCost);
                }

                var label = value.name;
                if(!$.isEmptyObject(actionCost) && amount > 1) {
                    label += " (" + SharkGame.Main.beautify(amount) + ")";
                }
                var costText = r.resourceListToString(actionCost, !enableButton);
                if(costText != "") {
                    label += "<br/>Cost: " + costText;
                }
                if(SharkGame.Settings.current.showTabHelp) {
                    if(value.helpText) {
                        label += "<br/><span class='medDesc'>" + value.helpText + "</span>";
                    }
                }
                button.prop("disabled", !enableButton).html(label);
            }
        });

        // update home message
        h.updateMessage();
    },

    onHomeButton: function() {
        var h = SharkGame.Home;
        var r = SharkGame.Resources;
        var amountToBuy = SharkGame.Settings.current.buyAmount;
        // get related entry in home button table
        var buttonName = $(this).attr("id");
        var action = SharkGame.HomeActions[buttonName];
        var actionCost = {};
        var amount = 0;
        if(amountToBuy < 0) {
            // unlimited mode, calculate the highest we can go
            var max = h.getMax(action);
            if(max > 0) {
                var divisor = Math.floor((amountToBuy)) * -1;
                amount = (max / divisor);
                actionCost = h.getCost(action, amount);
            }
        } else {
            actionCost = h.getCost(action, amountToBuy);
            amount = amountToBuy;
        }

        if($.isEmptyObject(actionCost)) {
            // free action
            // do not repeat or check for costs
            if(action.effect.resource) {
                r.changeManyResources(action.effect.resource);
            }
            SharkGame.Log.addMessage(SharkGame.choose(action.outcomes));
        } else if(amount > 0) {
            // cost action
            // check cost, only proceed if sufficient resources (prevention against lazy cheating, god, at least cheat in the right resources)
            if(r.checkResources(actionCost)) {
                // take cost
                r.changeManyResources(actionCost, true);
                // execute effects
                if(action.effect.resource) {
                    var resourceChange;
                    if(amount !== 1) {
                        resourceChange = r.scaleResourceList(action.effect.resource, amount);
                    } else {
                        resourceChange = action.effect.resource;
                    }
                    r.changeManyResources(resourceChange);
                }
                // print outcome to log
                if(!(action.multiOutcomes) || (amount == 1)) {
                    SharkGame.Log.addMessage(SharkGame.choose(action.outcomes));
                } else {
                    SharkGame.Log.addMessage(SharkGame.choose(action.multiOutcomes));
                }
            } else {
                SharkGame.Log.addMessage("You can't afford that!");
            }
        }
    },


    getCost: function(action, amount) {
        var calcCost = {};
        var rawCost = action.cost;

        $.each(rawCost, function(i, v) {
            var resource = SharkGame.ResourceTable[action.max];
            var currAmount = resource.amount;
            if(resource.jobs) {
                $.each(resource.jobs, function(_, v) {
                    currAmount += SharkGame.Resources.getResource(v);
                });
            }
            var costFunction = v.costFunction;
            var k = v.priceIncrease;
            var cost = 0;
            switch(costFunction) {
                case "constant":
                    cost = SharkGame.MathUtil.constantCost(currAmount, currAmount + amount, k);
                    break;
                case "linear":
                    cost = SharkGame.MathUtil.linearCost(currAmount, currAmount + amount, k);
                    break;
            }
            calcCost[v.resource] = cost;
        });
        return calcCost;
    },


    getMax: function(action) {
        var max = -1;
        if(action.max) {
            var resource = SharkGame.ResourceTable[action.max];
            var currAmount = resource.amount;
            if(resource.jobs) {
                $.each(resource.jobs, function(_, v) {
                    currAmount += SharkGame.Resources.getResource(v);
                });
            }
            max = Number.MAX_VALUE;
            var rawCost = action.cost;
            $.each(rawCost, function(_, v) {
                var costResource = SharkGame.ResourceTable[v.resource];

                var costFunction = v.costFunction;
                var k = v.priceIncrease;
                var subMax = -1;
                switch(costFunction) {
                    case "constant":
                        subMax = SharkGame.MathUtil.constantMax(currAmount, costResource.amount, k) - currAmount;
                        break;
                    case "linear":
                        subMax = SharkGame.MathUtil.linearMax(currAmount, costResource.amount, k) - currAmount;
                        break;
                }
                max = Math.min(max, subMax);
            });
        }
        return Math.floor(max);
    },

    toggleHelp: function() {
        SharkGame.Settings.current.showTabHelp = !SharkGame.Settings.current.showTabHelp;
    }
};

SharkGame.HomeActions = {
    'catchFish': {
        name: "Catch fish",
        effect: {
            resource: {
                'fish': 1
            }
        },
        cost: {},
        prereq: {
            // no prereqs
        },
        outcomes: [
            "Ate a tuna.",
            "Ate a mackerel.",
            "Ate a kipper. Wait. Hang on.",
            "You eat a fish hooray!",
            "Fish.",
            "Ate a cod.",
            "Ate a bass.",
            "Ate a shark. Wait. No, it wasn't a shark.",
            "Ate a salmon.",
            "Ate a carp.",
            "Ate an eel??",
            "Ate a shrimp. Wait. That's not a fish.",
            "Almost ate a remora.",
            "Dropped the bass."
        ],
        helpText: "Use your natural shark prowess to find and catch a fish."
    },

    'seaApplesToScience': {
        name: "Study sea apples",
        effect: {
            resource: {
                science: 5
            }
        },
        cost: [
            {resource: "seaApple", costFunction: "constant", priceIncrease: 1}
        ],
        max: "seaApple",
        prereq: {
            upgrade: [
                "xenobiology"
            ]
        },
        outcomes: [
            "There's science inside these things, surely!",
            "The cause of science is advanced!",
            "This is perhaps maybe insightful!",
            "Why are we even doing this? Who knows! Science!",
            "What is even the point of these things? Why are they named for fruit? They're squirming!"
        ],
        helpText: "Dissect sea apples to gain additional science. Research!"
    },

    'transmuteSharkonium': {
        name: "Transmute stuff to sharkonium",
        effect: {
            resource: {
                sharkonium: 1
            }
        },
        cost: [
            {resource: "crystal", costFunction: "constant", priceIncrease: 5},
            {resource: "sand", costFunction: "constant", priceIncrease: 15}
        ],
        max: "sharkonium",
        prereq: {
            upgrade: [
                "transmutation"
            ]
        },
        outcomes: [
            "Transmutation destination!",
            "Transmutation rejuvenation!",
            "Transmogrification revelation!",
            "Transformation libation!",
            "Transfiguration nation! ...wait.",
            "Sharkonium arise!",
            "Arise, sharkonium!",
            "More sharkonium!",
            "The substance that knows no name! Except the name sharkonium!",
            "The substance that knows no description! It's weird to look at.",
            "The foundation of a modern shark frenzy!"
        ],
        helpText: "Convert ordinary resources into sharkonium, building material of the future!"
    },

    'getShark': {
        name: "Recruit shark",
        effect: {
            resource: {
                'shark': 1
            }
        },
        cost: [
            {resource: "fish", costFunction: "linear", priceIncrease: 5}
        ],
        max: "shark",
        prereq: {
            resource: {
                'fish': 5
            }
        },
        outcomes: [
            "A bignose shark joins you.",
            "A blacktip reef shark joins you.",
            "A blue shark joins you.",
            "A bull shark joins you.",
            "A cat shark joins you.",
            "A crocodile shark joins you.",
            "A dusky whaler shark joins you.",
            "A dogfish joins you.",
            "A graceful shark joins you.",
            "A grey reef shark joins you.",
            "A goblin shark joins you.",
            "A hammerhead shark joins you.",
            "A hardnose shark joins you.",
            "A lemon shark joins you.",
            "A milk shark joins you.",
            "A nervous shark joins you.",
            "An oceanic whitetip shark joins you.",
            "A pigeye shark joins you.",
            "A sandbar shark joins you.",
            "A silky shark joins you.",
            "A silvertip shark joins you.",
            "A sliteye shark joins you.",
            "A speartooth shark joins you.",
            "A spinner shark joins you.",
            "A spot-tail shark joins you.",
            "A mako shark joins you.",
            "A tiger shark joins you.",
            "A tawny shark joins you.",
            "A white shark joins you.",
            "A zebra shark joins you."
        ],
        multiOutcomes: [
            "A whole bunch of sharks join you.",
            "That's a lot of sharks.",
            "The shark community grows!",
            "More sharks! MORE SHARKS!",
            "Sharks for the masses. Mass sharks.",
            "A shiver of sharks! No, that's a legit name. Look it up.",
            "A school of sharks!",
            "A shoal of sharks!",
            "A frenzy of sharks!",
            "A gam of sharks! Yes, that's correct." ,
            "A college of sharks! They're a little smarter than a school."
        ],
        helpText: "Recruit a shark to help catch more fish."
    },

    'getManta': {
        name: "Hire ray",
        effect: {
            resource: {
                'ray': 1
            }
        },
        cost: [
            {resource: "fish", costFunction: "linear", priceIncrease: 15}
        ],
        max: "ray",
        prereq: {
            resource: {
                'fish': 15
            }
        },
        outcomes: [
            "These guys seem to be kicking up a lot of sand!",
            "A spotted eagle ray joins you.",
            "A manta ray joins you.",
            "A stingray joins you.",
            "A clownnose ray joins you.",
            "A bluespotted maskray joins you.",
            "A bluntnose stingray joins you.",
            "A oman masked ray joins you.",
            "A bulls-eye electric ray joins you.",
            "A shorttailed electric ray joins you.",
            "A bentfin devil ray joins you.",
            "A lesser electric ray joins you.",
            "A cortez electric ray joins you.",
            "A feathertail stingray joins you.",
            "A thornback ray joins you.",
            "A giant shovelnose ray joins you.",
            "A pacific cownose ray joins you.",
            "A bluespotted ribbontail ray joins you.",
            "A marbled ribbontail ray joins you.",
            "A blackspotted torpedo ray joins you.",
            "A marbled torpedo ray joins you.",
            "A atlantic torpedo ray joins you.",
            "A panther torpedo ray joins you.",
            "A spotted torpedo ray joins you.",
            "A ocellated torpedo joins you.",
            "A caribbean torpedo joins you.",
            "A striped stingaree joins you.",
            "A sparesly-spotted stingaree joins you.",
            "A kapala stingaree joins you.",
            "A common stingaree joins you.",
            "A eastern fiddler ray joins you.",
            "A bullseye stingray joins you.",
            "A round stingray joins you.",
            "A yellow stingray joins you.",
            "A cortez round stingray joins you.",
            "A porcupine ray joins you.",
            "A sepia stingaree joins you.",
            "A banded stingaree joins you.",
            "A spotted stingaree joins you."
        ],
        multiOutcomes: [
            "A whole bunch of rays join you.",
            "That's a lot of rays.",
            "The ray conspiracy grows!",
            "I can't even deal with all of these rays.",
            "More rays more rays more more more.",
            "A school of rays!",
            "A fever of rays! Yes, seriously. Look it up.",
            "A whole lotta rays!",
            "The sand is just flying everywhere!" ,
            "So many rays."
        ],
        helpText: "Hire a ray to help collect fish. They might kick up some sand from the seabed."
    },


    'getCrab': {
        name: "Acquire crab",
        effect: {
            resource: {
                'crab': 1
            }
        },
        cost: [
            {resource: "fish", costFunction: "linear", priceIncrease: 10}
        ],
        max: "crab",
        prereq: {
            resource: {
                'shark': 4,
                'ray': 4
            }
        },
        outcomes: [
            "A crab starts sifting shiny things out of the sand.",
            "A bering hermit joins you.",
            "A blackeye hermit joins you.",
            "A butterfly crab joins you.",
            "A dungeness crab joins you.",
            "A flattop crab joins you.",
            "A greenmark hermit joins you.",
            "A golf-ball crab joins you.",
            "A graceful crab joins you.",
            "A graceful decorator crab joins you.",
            "A graceful kelp crab joins you.",
            "A green shore crab joins you.",
            "A heart crab joins you.",
            "A helmet crab joins you.",
            "A longhorn decorator crab joins you.",
            "A maroon hermit joins you.",
            "A moss crab joins you.",
            "A northern kelp crab joins you.",
            "A orange hairy hermit joins you.",
            "A purple shore crab joins you.",
            "A pygmy rock crab joins you.",
            "A puget sound king crab joins you.",
            "A red rock crab joins you.",
            "A scaled crab joins you.",
            "A sharpnose crab joins you.",
            "A spiny lithoid crab joins you.",
            "A widehand hermit joins you.",
            "A umbrella crab joins you."
        ],
        multiOutcomes: [
            "A lot of crabs join you.",
            "CRABS EVERYWHERE",
            "Crabs. Crabs. Crabs!",
            "Feels sort of crab-like around here.",
            "A cast of crabs!",
            "A dose of crabs!",
            "A cribble of crabs! Okay, no, that one's made up.",
            "So many crabs."
        ],
        helpText: "Hire a crab to find things that sharks and rays overlook."
    },

    'getScientist': {
        name: "Train science shark",
        effect: {
            resource: {
                'scientist': 1
            }
        },
        cost: [
            {resource: "shark", costFunction: "constant", priceIncrease: 1},
            {resource: "crystal", costFunction: "linear", priceIncrease: 20}
        ],
        max: "scientist",
        prereq: {
            resource: {
                'crystal': 20
            }
        },
        outcomes: [
            "Doctor Shark, coming right up!",
            "A scientist shark is revealed!",
            "After many painful years of study, a shark that has developed excellent skills in making excuses-- er, in science!",
            "PhD approved!",
            "Graduation complete!",
            "A new insight drives a new shark to take up the cause of science!"
        ],
        multiOutcomes: [
            "The training program was a success!",
            "Look at all this science!",
            "Building a smarter, better shark!",
            "Beakers! Beakers underwater! It's madness!",
            "Let the science commence!"
        ],
        helpText: "Train a shark in the fine art of research and the science of, well, science.",
    },

    'getNurse': {
        name: "Train nurse shark",
        effect: {
            resource: {
                'nurse': 1
            }
        },
        cost: [
            {resource: "shark", costFunction: "constant", priceIncrease: 1},
            {resource: "fish", costFunction: "linear", priceIncrease: 100}
        ],
        max: "nurse",
        prereq: {
            upgrade: [
                "biology"
            ]
        },
        outcomes: [
            "A nurse shark is ready!",
            "Shark manufacturer primed.",
            "Nurse shark trained.",
            "Medical exam passed! Nurse shark is go!"
        ],
        multiOutcomes: [
            "More sharks are on the way soon.",
            "Shark swarm begins!",
            "There will be no end to the sharks!",
            "Sharks forever!",
            "The sharks will never end. The sharks are eternal.",
            "More sharks to make more sharks to make more sharks..."
        ],
        helpText: "Remove a shark from fish duty and set them to shark making duty."
    },

    'getLaser': {
        name: "Equip laser ray",
        effect: {
            resource: {
                'laser': 1
            }
        },
        cost: [
            {resource: "ray", costFunction: "constant", priceIncrease: 1},
            {resource: "crystal", costFunction: "linear", priceIncrease: 50}
        ],
        max: "laser",
        prereq: {
            upgrade: [
                "laserRays"
            ]
        },
        outcomes: [
            "Laser ray online!",
            "Laser ray! With a laser ray! It's laser ray, with a laaaaaser raaaay!",
            "Laser ray.",
            "Ray suited up with a laaaaaaser!",
            "Ray lasered. To use a laser. Not the subject of a laser."
        ],
        multiOutcomes: [
            "Boil the seabed!",
            "Churn the sand to crystal!",
            "Laser ray armada in position!",
            "Ray crystal processing initiative is growing stronger every day!",
            "Welcome to the future! The future is lasers!"
        ],
        helpText: "Remove a ray from sand detail and let them fuse sand into raw crystal."
    },

    'getMaker': {
        name: "Instruct a ray maker",
        effect: {
            resource: {
                'maker': 1
            }
        },
        cost: [
            {resource: "ray", costFunction: "constant", priceIncrease: 1},
            {resource: "fish", costFunction: "linear", priceIncrease: 300},
            {resource: "kelp", costFunction: "linear", priceIncrease: 15}
        ],
        max: "maker",
        prereq: {
            upgrade: [
                "rayBiology"
            ]
        },
        outcomes: [
            "The application of kelp supplements has made a ray very productive.",
            "More rays lets you get more rays which you can then use to get more rays.",
            "The ray singularity begins!",
            "A ray maker is ready.",
            "Looks like you gave them quite the ray maker blow! 'Them' being the intangible enemy that is lacking in resources.",
            "The ray seems concerned, but obliges. The mission has been given."
        ],
        multiOutcomes: [
            "All these makers. What are they making? What is it for? Oh. It's rays, and it's probably for sand or something.",
            "More ray makers means more rays. Do you understand what that means?! Do you?! It means more rays. Good. On the same page, then.",
            "Rapidly breeding aquatic wildlife is probably a severe ecological hazard. Good thing this isn't Earth's oceans, probably!",
            "Have you ever thought about what the rays wanted? Because this might have been what they wanted after all.",
            "MORE LASER RAYS FOR THE LASER ARMY-- oh. Well, this is good too."
        ],
        helpText: "Remove a ray from sand business and let them concentrate on making more rays."
    },

    'getPlanter': {
        name: "Gear up planter crab",
        effect: {
            resource: {
                'planter': 1
            }
        },
        cost: [
            {resource: "crab", costFunction: "constant", priceIncrease: 1},
            {resource: "sand", costFunction: "linear", priceIncrease: 200}
        ],
        max: "planter",
        prereq: {
            upgrade: [
                "kelpHorticulture"
            ]
        },
        outcomes: [
            "Crab set up with seeds.",
            "Shell studded with kelp.",
            "Crab is going on a mission. A mission... to farm.",
            "Planter crab equipped and ready to move a few feet and start planting some things!",
            "Crab is ready to farm!"
        ],
        multiOutcomes: [
            "Carpet the seabed!",
            "Kelp kelp kelp kelp kelp kelp kelp kelp.",
            "Horticulturists unite!",
            "Strike the sand!",
            "Pat the sand very gently and put kelp in it!",
            "More kelp. The apples. They hunger. They hunger for kelp."
        ],
        helpText: "Equip a crab with the equipment and training to plant kelp across the ocean bottom."
    },

    'getBrood': {
        name: "Form crab brood",
        effect: {
            resource: {
                'brood': 1
            }
        },
        cost: [
            {resource: "crab", costFunction: "constant", priceIncrease: 20},
            {resource: "fish", costFunction: "linear", priceIncrease: 200}
        ],
        max: "brood",
        prereq: {
            upgrade: [
                "crabBiology"
            ]
        },
        outcomes: [
            "A bunch of crabs pile together into some sort of weird cluster.",
            "Crab team, assemble! FORM THE CRAB BROOD!",
            "[This message has been censored for reasons of being mostly really gross.]",
            "Eggs, eggs everywhere, but never stop and think.",
            "Writhing crab pile. Didn't expect those words next to each other today, did you.",
            "The crab brood is a rarely witnessed phenomenon, due to being some strange behaviour of crabs that have been driven to seek crystals for reasons only they understand."
        ],
        multiOutcomes: [
            "The broods grow. The swarm rises.",
            "All these crabs are probably a little excessive. ...is what I could say, but I'm going to say this instead. MORE CRABS.",
            "A sea of crabs on the bottom of the sea. Clickity clackity.",
            "Snip snap clack clack burble burble crabs crabs crabs crabs.",
            "More crabs are always a good idea. Crystals aren't cheap.",
            "The broods swell in number. The sharks are uneasy, but the concern soon passes.",
            "Yes. Feed the kelp. Feed it. Feeeeeed it."
        ],
        helpText: "Meld several crabs into a terrifying, incomprehensible crab-producing brood cluster."
    },

    'getCrystalMiner': {
        name: "Build crystal miner",
        effect: {
            resource: {
                'crystalMiner': 1
            }
        },
        cost: [
            {resource: "crystal", costFunction: "linear", priceIncrease: 100},
            {resource: "sand", costFunction: "linear", priceIncrease: 200},
            {resource: "sharkonium", costFunction: "linear", priceIncrease: 20}
        ],
        max: "crystalMiner",
        prereq: {
            upgrade: [
                "automation"
            ]
        },
        outcomes: [
            "Crystal miner activated.",
            "Crystal miner constructed.",
            "Mining machine online.",
            "Construction complete.",
            "Carve rock. Remove sand. Retrieve target."
        ],
        multiOutcomes: [
            "The machines rise.",
            "The miners dig.",
            "The crystal shall be harvested.",
            "Crystal miners are complete."
        ],
        helpText: "Construct a machine to automatically harvest crystals efficiently."
    },

    'getSandDigger': {
        name: "Build sand digger",
        effect: {
            resource: {
                'sandDigger': 1
            }
        },
        cost: [
            {resource: "sand", costFunction: "linear", priceIncrease: 500},
            {resource: "sharkonium", costFunction: "linear", priceIncrease: 150}
        ],
        max: "sandDigger",
        prereq: {
            upgrade: [
                "automation"
            ]
        },
        outcomes: [
            "Sand digger constructed.",
            "Sand digger reaches into the seabed.",
            "The digger begins to shuffle sand into its machine maw. Rays dart away.",
            "The machine is online.",
            "The machine acts immediately, shovelling sand."
        ],
        multiOutcomes: [
            "The machines increase in number.",
            "The diggers devour.",
            "All sand must be gathered.",
            "The rays are concerned.",
            "Devour the sands. Consume."
        ],
        helpText: "Construct a machine to automatically dig up sand efficiently."
    },

    'getAutoTransmuter': {
        name: "Build auto-transmuter",
        effect: {
            resource: {
                'autoTransmuter': 1
            }
        },
        cost: [
            {resource: "crystal", costFunction: "linear", priceIncrease: 100},
            {resource: "sharkonium", costFunction: "linear", priceIncrease: 200}
        ],
        max: "autoTransmuter",
        prereq: {
            upgrade: [
                "automation"
            ]
        },
        outcomes: [
            "Auto-transmuter activated.",
            "Auto-transmuter constructed.",
            "Transmutation machine online.",
            "Construction complete.",
            "Provide inputs. Only the output matters."
        ],
        multiOutcomes: [
            "Auto-transmuters are prepared.",
            "The difference between science and magic is reliable application.",
            "All is change.",
            "Change is all.",
            "The machines know many secrets, yet cannot speak of them."
        ],
        helpText: "Construct a machine to automatically transmute sand and crystal to sharkonium."
    },

    'getFishMachine': {
        name: "Build fish machine",
        effect: {
            resource: {
                fishMachine: 1
            }
        },
        cost: [
            {resource: "sharkonium", costFunction: "linear", priceIncrease: 100}
        ],
        max: "fishMachine",
        prereq: {
            upgrade: [
                "automation"
            ]
        },
        outcomes: [
            "Fish machine activated.",
            "Fish machine constructed.",
            "Fishing machine online.",
            "Construction complete.",
            "The quarry moves. But the machine is faster."
        ],
        multiOutcomes: [
            "One day there will be no fish left. Only the machines.",
            "Today the shark is flesh. Tomorrow, machine.",
            "Your metal servants can sate the hunger. The hunger for fish.",
            "The fishing machines are more efficient than the sharks. But they aren't very smart.",
            "Automated fishing.",
            "The power of many, many sharks, in many, many devices."
        ],
        helpText: "Construct a machine to automatically gather fish efficiently."
    }
};