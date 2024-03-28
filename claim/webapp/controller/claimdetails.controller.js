sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
], function(Controller, JSONModel, ODataModel) {
    "use strict";

    return Controller.extend("claim.controller.claimdetails", {
        onInit: function() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("claimdetails").attachMatched(this._onRouteMatched, this);
           
        },
       
        _onRouteMatched: function(oEvent) {
            var that = this;
            var oArgs = oEvent.getParameter("arguments");
            var sClaimId = oArgs.ID;
        
            // Set the CLAIM_ID for later use
            this._sClaimId = sClaimId;
        
            // Make a fetch call to fetch the claim details based on CLAIM_ID
            fetch("./odata/v4/my/ClaimDetails?$filter=CLAIM_ID eq " + sClaimId)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function(data) {
                console.log(data.value);
        
                // Create a new JSON model and set the data
                var oLocalModel = new sap.ui.model.json.JSONModel();
                that.getView().setModel(oLocalModel, "localModel");
                oLocalModel.setProperty("/dataValue", data.value);
            })
            .catch(function(error) {
                // Handle error
                console.error('There has been a problem with your fetch operation:', error);
            });
        }, 

        onNavBack: function() {
            // Get the router instance
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        
            // Navigate back to the claim page
            oRouter.navTo("ess");
        },    

        formatDate: function(sDate) {
            if (!sDate) {
                return "";
            }
        
            var oDate = new Date(sDate);
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "yyyy-MM-dd"});
            return oDateFormat.format(oDate);
        },

        isEditVisible: function(sStatus) {
            // Define the status that triggers the edit button visibility
            var allowedStatus = "Claim sent back to employee";
        
            // Return true if the status matches the allowed status, otherwise return false
            return sStatus === allowedStatus;
        },

        onEdit: function() {
            // Get the router instance
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        
            // Navigate to the detail1 page
            oRouter.navTo("ess"); 
        },
        

       
    });
});
