SharkGame.Recycler = {

    tabId: "recycler",
    tabDiscovered: false,
    tabName: "Recycler",

    discoverReq: {
        upgrade: [
            "recyclerDiscovery"
        ]
    },

    message: "The recycler allows for the repurposing of any and all of your unwanted materials.<br/><span class='medDesc'>Feed the machines. Feed them.</span>",

    recyclerInputMessages: [
        "The machines grind and churn.",
        "Screech clunk chomp munch erp.",
        "Clunk clunk clunk screeeeech.",
        "The recycler hungrily devours the stuff you offer.",
        "The offerings are no more.",
        "Viscous, oily mess sloshes within the machine.",
        "The recycler reprocesses."
    ],

    recyclerOutputMessages: [
        "A brand new whatever!",
        "The recycler regurgitates your demand, immaculately formed.",
        "How does a weird blackish gel become THAT?",
        "Some more stuff to use! Maybe even to recycle!",
        "Gifts from the machine! Gifts that may have cost a terrible price!",
        "How considerate of this unfeeling, giant apparatus! It provides you stuff at inflated prices!"
    ],

    allowedCategories: [
        "machines",
        "stuff",
        "processed"
    ],

    bannedResources: [
        "essence",
        "junk",
        "science"
    ],

    init: function() {
        var y = SharkGame.Recycler;
        // register tab
        SharkGame.Tabs[y.tabId] = {
            id: y.tabId,
            name: y.tabName,
            discovered: y.tabDiscovered,
            discoverReq: y.discoverReq,
            code: y
        };
    },

    switchTo: function() {
        var y = SharkGame.Recycler;
        var m = SharkGame.Main;
        var content = $('#content');
        content.append($('<div>').attr("id", "tabMessage"));
        var container = $('<div>').attr("id", "recyclerContainer");
        container.append($('<div>').attr("id", "inputButtons"));
        container.append($('<div>').attr("id", "junkDisplay"));
        container.append($('<div>').attr("id", "outputButtons"));
        content.append(container);
        content.append($('<div>').addClass("clear-fix"));
        $('#tabMessage').html(y.message);

        m.createBuyButtons("eat");
        y.createButtons();
    },

    update: function() {
        var y = SharkGame.Recycler;

        y.updateJunkDisplay();
        y.updateButtons();
    },

    updateJunkDisplay: function() {
        var r = SharkGame.Resources;
        var y = SharkGame.Recycler;
        var m = SharkGame.Main;

        var junkDisplay = $('#junkDisplay');
        junkDisplay.html("CONTENTS:<br/><br/>" + m.beautify(r.getResource("junk")) + "<br/><br/>RESIDUE");
    },

    updateButtons: function() {
        var r = SharkGame.Resources;
        var y = SharkGame.Recycler;
        var m = SharkGame.Main;
        $.each(SharkGame.ResourceTable, function(k, v) {
            if(r.getTotalResource(k) > 0) {
                var inputButton = $('#input-' + k);
                var outputButton = $('#output-' + k);
                var resourceAmount = r.getResource(k);

                // determine amounts for input and what would be retrieved from output
                var selectedAmount = SharkGame.Settings.current.buyAmount;
                var forceSingular = selectedAmount === 1;
                var inputAmount = selectedAmount;
                var outputAmount = selectedAmount;
                if(selectedAmount < 0) {
                    var divisor = Math.floor(selectedAmount) * -1;
                    inputAmount = resourceAmount / divisor;
                    outputAmount = y.getMaxToBuy(k) / divisor;
                }

                // update input button
                var disableButton = (resourceAmount < inputAmount) || (inputAmount <= 0);
                var label = "Recycle ";
                if(inputAmount > 0) {
                    label += m.beautify(inputAmount) + " ";
                }
                label += r.getResourceName(k, disableButton, forceSingular);
                inputButton.html(label).prop("disabled", disableButton);

                // update output button
                disableButton = (outputAmount <= 0);
                label = "Convert to ";
                if(outputAmount > 0) {
                    label += m.beautify(outputAmount) + " ";
                }
                label += r.getResourceName(k, disableButton, forceSingular);
                outputButton.html(label).prop("disabled", disableButton);
            }
        });
    },

    createButtons: function() {
        var r = SharkGame.Resources;
        var y = SharkGame.Recycler;
        var m = SharkGame.Main;
        var inputButtonDiv = $('#inputButtons');
        var outputButtonDiv = $('#outputButtons');
        $.each(SharkGame.ResourceTable, function(k, v) {
            if(r.getTotalResource(k) > 0
                && y.allowedCategories.indexOf(r.getCategoryOfResource(k)) !== -1
                && y.bannedResources.indexOf(k) === -1) {
                SharkGame.Button.makeButton("input-" + k, "Recycle " + r.getResourceName(k), inputButtonDiv, y.onInput);
                SharkGame.Button.makeButton("output-" + k, "Convert to " + r.getResourceName(k), outputButtonDiv, y.onOutput);
            }
        });
    },

    onInput: function() {
        var r = SharkGame.Resources;
        var l = SharkGame.Log;
        var y = SharkGame.Recycler;
        var resourceName = ($(this).attr("id")).split("-")[1];
        var resourceAmount = r.getResource(resourceName);
        var junkPerResource = SharkGame.ResourceTable[resourceName].junkValue;

        var selectedAmount = SharkGame.Settings.current.buyAmount;
        var amount = selectedAmount;
        if(selectedAmount < 0) {
            var divisor = Math.floor(selectedAmount) * -1;
            amount = resourceAmount / divisor;
        }

        if(resourceAmount >= amount) {
            r.changeResource(resourceName, -amount);
            r.changeResource("junk", amount * junkPerResource);
            l.addMessage(SharkGame.choose(y.recyclerInputMessages));
        } else {
            l.addMessage("You don't have enough for that!");
        }
    },

    onOutput: function() {
        var r = SharkGame.Resources;
        var l = SharkGame.Log;
        var y = SharkGame.Recycler;
        var resourceName = ($(this).attr("id")).split("-")[1];
        var junkAmount = r.getResource("junk");
        var junkPerResource = SharkGame.ResourceTable[resourceName].junkValue;

        var selectedAmount = SharkGame.Settings.current.buyAmount;
        var amount = selectedAmount;
        if(selectedAmount < 0) {
            var divisor = Math.floor(selectedAmount) * -1;
            amount = y.getMaxToBuy(resourceName) / divisor;
        }

        var junkNeeded = amount * junkPerResource;
        if(junkAmount >= junkNeeded) {
            r.changeResource(resourceName, amount);
            r.changeResource("junk", -junkNeeded);
            l.addMessage(SharkGame.choose(y.recyclerOutputMessages));
        } else {
            l.addMessage("You don't have enough for that!");
        }
    },

    getMaxToBuy: function(resource) {
        var resourceAmount = SharkGame.Resources.getResource(resource);
        var junkAmount = SharkGame.Resources.getResource("junk");
        var junkPricePerResource = SharkGame.ResourceTable[resource].junkValue;
        var max = SharkGame.MathUtil.constantMax(resourceAmount, junkAmount, junkPricePerResource) - resourceAmount;
        return Math.floor(max);
    }
};