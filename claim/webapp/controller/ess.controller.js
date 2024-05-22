sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/upload/UploadSetwithTable",
    "sap/m/upload/UploadSetwithTableItem",


],

    function (Controller, Device, JSONModel, MessageBox, DateFormat, ODataModel, MessageToast, History, UIComponent, Button, Text, UploadSetwithTable, UploadSetwithTableItem,) {
        "use strict";



        return Controller.extend("claim.controller.ess", {
            onInit: function () {
                Device.orientation.attachHandler(this.onOrientationChange, this);
                this._oModel = this.getView().getModel("MainModel");

                var oLocalModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oLocalModel, "localModel");

                this.getView().setModel(new JSONModel({
                    isNextButtonVisible: true,
                    isSubmitButtonVisible: false
                }), "footerModel");

                // Set initial visibility of buttons
                this.updateButtonVisibility();

                // var olocalModel = new JSONModel();
                // this.getView().setModel(olocalModel, "localModel");
                this.sLastSelectedTab = "claimDetails"

                this.updateTotalRequestedAmount();

                var oModel = new ODataModel("/odata/v4/my/");
                this.getView().setModel(oModel);

                var oComboBox = this.byId("Hospitallocation");
                oComboBox.attachChange(this.onHospitalLocationChange, this);
                var oDateFormat = DateFormat.getDateTimeInstance({ pattern: "yyyy/MM/dd" });
                this.updateCurrentDate(oDateFormat);
                this.scheduleDailyUpdate(oDateFormat);
            },



            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },
            onNavBack: function () {
                // Assuming you have a reference to the router
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                // Navigate to the login page
                oRouter.navTo("RouteLogin");
            },

            // onTabSelect: function (oEvent) {
            //     this.updateButtonVisibility();

            //     var sSelectedKey = oEvent.getParameter("key");

            //     // Check if moving from "Claim Details" to "Create" tab
            //     if (this.sLastSelectedTab === "claimDetails") {
            //         // Validate fields in "Claim Details" tab

            //         // Save data from the current tab to the localModel
            //         this.saveDataTolocalModel();
            //         var aMissingFields = this.validateRequiredFields("claimDetails");
            //         if (aMissingFields.length > 0) {
            //             // Show an error message with missing required fields
            //             var sErrorMessage = "Please fill in all required fields in Claim Details tab: " + aMissingFields.join(", ");
            //             MessageBox.error(sErrorMessage);
            //             // If validation fails, prevent switching to the "Create" tab
            //             this.byId("myIconTabBar").setSelectedKey("claimDetails");
            //             return;
            //         }
            //     }
            //     else if (this.sLastSelectedTab === "Create") {
            //         var oCheckBoxAccept = this.byId("Accept");
            //         var bIsCheckBoxChecked = oCheckBoxAccept.getSelected();

            //         if (!bIsCheckBoxChecked) {
            //             // CheckBox is not checked, show an error message
            //             MessageBox.error("Please acknowledge and accept the terms and conditions.");
            //             this.byId("myIconTabBar").setSelectedKey("Create");
            //             return;
            //         }
            //     }

            //     // Continue with the normal logic for other tabs
            //     this.sLastSelectedTab = sSelectedKey;

            //     // Your existing logic for the selected tab
            //     if (sSelectedKey === "review") {
            //         this.updateTotalRequestedAmount();
            //     }
            // },

            validateAndSwitchTab: function (currentTab, nextTab) {
                var aMissingFields = this.validateRequiredFields(currentTab);

                if (aMissingFields.length > 0) {
                    // Show an error message with missing required fields
                    var sErrorMessage = "Please fill in all required fields in " + this.getTabName(currentTab) + " tab: " + aMissingFields.join(", ");
                    MessageBox.error(sErrorMessage);
                    // If validation fails, prevent switching to the next tab
                    this.byId("myIconTabBar").setSelectedKey(currentTab);
                } else {
                    // Switch to the next tab if validation passes
                    this.sLastSelectedTab = currentTab;
                }
            },


            getTabName: function (tabKey) {
                // Add logic to return the tab name based on the tab key
                switch (tabKey) {
                    case "claimDetails":
                        return "Claim Details";
                    case "Create":
                        return "Create";
                    case "review":
                        return "Review";
                    default:
                        return "";
                }
            },


            dateFormatter: function (date) {
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "yyyy/MM/dd"
                });
                return oDateFormat.format(new Date(date));
            },
            updateCurrentDate: function (oDateFormat) {
                var currentDate = new Date();
                var formattedDate = oDateFormat.format(currentDate);
                var oModel = new JSONModel({ currentDate: formattedDate });
                this.getView().setModel(oModel, "CurrentDate");
            },

            scheduleDailyUpdate: function (oDateFormat) {
                var self = this;
                setInterval(function () {
                    self.updateCurrentDate(oDateFormat);
                }, 24 * 60 * 60 * 1000);
            },

            formatdate: function (date) {
                if (!date) {
                    return "";
                }
                var oDateFormat = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd" });
                return oDateFormat.format(date);
            },
            // formatDate: function (date) {
            //     if (!date) {
            //         return "";
            //     }

            //     var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            //         pattern: "MMM d, yyyy"
            //     });

            //     return oDateFormat.format(date);
            // },
            SubmitDate: function (dateString) {
                if (!dateString) {
                    return "";
                }

                // Create a Date object from the string
                var date = new Date(dateString);

                // Check if the date is valid
                if (isNaN(date.getTime())) {
                    return "";
                }

                // Format the date
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM dd, yyyy" });
                return oDateFormat.format(date);
            },
            formatStatus: function (status) {
                return status ? status : "Submitted";
            },
            formatClaimId: function (sClaimId) {
                // Remove commas from the CLAIM_ID
                return sClaimId.replace(/,/g, '');
            },
            // formatPersonNumber: function (sPersonNumber) {
            //     // Remove commas from the PERSON_NUMBER
            //     return sPersonNumber.replace(/,/g, '');
            // },
            formatPersonNumber: function (sPersonNumber) {
                // Check if sPersonNumber is null or undefined
                if (sPersonNumber != null && sPersonNumber !== undefined) {
                    // Remove commas from the PERSON_NUMBER
                    return sPersonNumber.replace(/,/g, '');
                } else {
                    // Return empty string or handle the case accordingly
                    return '';
                }
            },

            onListItemPress: function (oEvent) {
                var listItem = oEvent.getParameter("listItem");

                if (listItem) {
                    var sToPageId = listItem.data("to");

                    if (sToPageId) {
                        this.getSplitAppObj().toDetail(this.createId(sToPageId));
                    } else {
                        console.error("Invalid destination for list item.");
                    }
                }
            },


            getSplitAppObj: function () {
                var view = this.getView();

                if (view) {
                    var splitContainer = view.byId("SplitContDemo");
                    return splitContainer;
                }

                return null;
            },
            onPressDetailBack: function () {
                var oSplitContainer = this.getView().byId("SplitContDemo");
                oSplitContainer.toMaster(this.createId("master"));
            },



            handleNext: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var aItems = oIconTabBar.getItems();
                var sSelectedKey = oIconTabBar.getSelectedKey();

                var iCurrentIndex = aItems.findIndex(function (oItem) {
                    return oItem.getKey() === sSelectedKey;
                });

                // Save data from the current tab to the localModel
                this.saveDataTolocalModel();

                // Check if all required fields are filled in the current tab
                var aMissingFields = this.validateRequiredFields(sSelectedKey);

                if (aMissingFields.length === 0) {
                    // Check if the CheckBox "Accept" is checked
                    if (sSelectedKey === "Create") {
                        var oCheckBoxAccept = this.byId("Accept");
                        var bIsCheckBoxChecked = oCheckBoxAccept.getSelected();

                        if (!bIsCheckBoxChecked) {
                            // CheckBox is not checked, show an error message
                            MessageBox.error("Please acknowledge and accept the terms and conditions.");
                            return;
                        }
                    }

                    // Proceed with the next logic
                    if (iCurrentIndex < aItems.length - 1) {
                        // Select the next tab
                        oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());

                        // Update button visibility
                        this.updateButtonVisibility();
                    }
                } else {
                    // Show an error message with missing required fields
                    var sErrorMessage = "Please fill in all required fields: " + aMissingFields.join(", ");
                    MessageBox.error(sErrorMessage);
                    return; // Stop further execution
                }

                // Execute AJAX call only if "claimDetails" is the first tab
                if (sSelectedKey === "claimDetails" && iCurrentIndex === 0) {
                    var startDate = this.byId("startDatePicker1").getDateValue().toISOString().split('T')[0];
                    var PolicyNumber = this.byId("PolicyNumber").getSelectedItem().getKey();
                    var illnessName = this.byId("TF").getSelectedKey();

                    fetch("./odata/v4/my/policyValidations(policyNumber='" + PolicyNumber + "',startDate=" + startDate + ",illnessName='" + illnessName + "')", {
                        method: "GET"
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.value.success) {
                                oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());
                            } else {
                                MessageBox.error(data.value.message);
                                oIconTabBar.setSelectedKey(sSelectedKey);
                            }
                        })
                        .catch(error => {
                            // Handle fetch error
                            console.error('Error:', error);
                        });

                }

            },


            validateRequiredFields: function (sSelectedKey) {
                var missingFields = [];

                if (sSelectedKey === "claimDetails") {
                    var oCT = this.byId("CT");
                    var oTT = this.byId("TT");
                    var oStartDatePicker1 = this.byId("startDatePicker1");
                    var oEndDatePicker1 = this.byId("endDatePicker1");
                    var oTF = this.byId("TF");
                    var oSD = this.byId("SD");

                    if (!oCT.getValue()) {
                        missingFields.push("Claim Type");
                    }
                    if (!oTT.getValue()) {
                        missingFields.push("Treatment Type");
                    }
                    if (!oStartDatePicker1.getDateValue()) {
                        missingFields.push("Claim Start Date");
                    }
                    if (!oEndDatePicker1.getDateValue()) {
                        missingFields.push("Claim End Date");
                    }
                    if (!oTF.getValue()) {
                        missingFields.push("Treatment For");
                    }
                    if (!oSD.getValue()) {
                        missingFields.push("Select Dependents");
                    }
                }

                return missingFields;
            },


            handleBack: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var aItems = oIconTabBar.getItems();
                var iSelectedIndex = oIconTabBar.getSelectedKey();

                var iCurrentIndex = aItems.findIndex(function (oItem) {
                    return oItem.getKey() === iSelectedIndex;
                });

                if (iCurrentIndex > 0) {
                    oIconTabBar.setSelectedKey(aItems[iCurrentIndex - 1].getKey());
                    this.updateButtonVisibility();
                }
            },

            updateButtonVisibility: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var oBackButton = this.getView().byId("BackButton");
                var oNextButton = this.getView().byId("nextButton");
                var oSubmitButton = this.getView().byId("submitButton");
                var oSelectedTab = oIconTabBar.getSelectedKey();

                if (oSelectedTab === "review") {
                    oBackButton.setVisible(true);
                    oNextButton.setVisible(false);
                    oSubmitButton.setVisible(true);
                } else {
                    oBackButton.setVisible(true);
                    oNextButton.setVisible(true);
                    oSubmitButton.setVisible(false);
                }
            },

            saveDataTolocalModel: function () {
                var olocalModel = this.getView().getModel("localModel");

                // Set properties for Claim Type
                olocalModel.setProperty("/claimType", this.byId("CT").getSelectedKey());

                // Set properties for Claim Start and End Dates
                olocalModel.setProperty("/claimStartDate", this.byId("startDatePicker1").getValue());
                olocalModel.setProperty("/claimEndDate", this.byId("endDatePicker1").getValue());

                // Set properties for Treatment For
                olocalModel.setProperty("/treatmentFor", this.byId("TF").getSelectedKey());

                // Set properties for Treatment For (If Other)
                olocalModel.setProperty("/treatmentForOther", this.byId("TreatmentForOther").getValue());
                olocalModel.setProperty("/treatmentType", this.byId("TT").getValue());

                // Set properties for Select Dependents
                olocalModel.setProperty("/selectedDependent", this.byId("SD").getSelectedKey());

                olocalModel.setProperty("/claimId", this.byId("claimIdLabel").getText());

                olocalModel.setProperty("/Id", this.byId("claimId").getText());

                // var claimIdInput = this.byId("claimIdInput");
                // var claimId = claimIdInput.getValue().replace(/\D/g, ''); 
                // olocalModel.setProperty("/claimId", claimId);


            },

            addPress: function () {
                // Get all the form values
                var category = this.byId("consultancycategorys").getSelectedKey();

                // Check if category is selected
                if (!category) {
                    MessageBox.error("Please select a category.");
                    return;
                }

                // Get other form values
                var startDate = this.byId("startDatePicker1").getDateValue();
                var startdate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(startDate);

                var endDate = this.byId("endDatePicker1").getDateValue();
                var enddate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(endDate);

                var doctor = this.byId("DN").getValue();
                var patientId = this.byId("ID").getValue();
                var hospitalStore = this.byId("HospitalStore").getSelectedKey();
                var hospitalLocation = this.byId("Hospitallocation").getSelectedKey();
                var hospitalLocationOther = this.byId("HL").getValue();
                var billDate = this.byId("billdate").getDateValue();
                var billdate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(billDate);

                var billNo = this.byId("billno").getValue();
                var billAmount = this.byId("billamount").getValue();
                // var discount = this.byId("discount").getValue();
                var discountInput = this.byId("discount").getValue().trim();
                var discount = discountInput === '' ? '0' : discountInput;
                var requestedAmount = this.byId("requestamount").getValue();
                var review = this.byId("description").getValue();

                // Initialize an array to store the names of missing fields
                var missingFields = [];

                // Perform validation checks for missing fields
                if (!doctor) missingFields.push("Doctor's Name");
                if (!patientId) missingFields.push("Patient ID");
                if (!hospitalStore) missingFields.push("Hospital/Medical Store");
                if (!hospitalLocation) missingFields.push("Hospital Location");
                if (!billDate) missingFields.push("Bill Date");
                if (!billNo) missingFields.push("Bill No");
                if (!billAmount) missingFields.push("Bill Amount(Rs)");
                if (!requestedAmount) missingFields.push("Requested Amount");

                // Check if any fields are missing
                if (missingFields.length > 0) {
                    // Display an error message with the list of missing fields
                    var errorMessage = "Please fill in the following required fields:\n" + missingFields.join("\n");
                    MessageBox.error(errorMessage);
                    return;
                }

                // Perform validation
                fetch("./odata/v4/my/validations(endDate=" + enddate + ",startDate=" + startdate + ",requestedAmount=" + requestedAmount + `,category='` + category + `')`, {
                    method: "GET"
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.value.success) {
                            // Proceed with validation
                            if (requestedAmount > data.value.finalAmount) {
                                // Show information message
                                var eligibleAmountMessage = "Your eligible amount is: " + data.value.finalAmount;
                                MessageBox.information(eligibleAmountMessage, {
                                    onClose: function (oAction) {
                                        if (oAction === MessageBox.Action.OK) {
                                            // Add details to model
                                            var details = {
                                                CONSULTANCY_CATEGORY: category,
                                                DOCTOR_NAME: doctor,
                                                PATIENT_ID: patientId,
                                                MEDICAL_STORE: hospitalStore,
                                                HOSPITAL_LOCATION: hospitalLocation,
                                                // hospitalLocationOther: hospitalLocationOther,
                                                BILL_DATE: billdate,
                                                BILL_NO: billNo,
                                                BILL_AMOUNT: billAmount,
                                                DISCOUNT: discount,
                                                REQUESTED_AMOUNT: data.value.finalAmount,
                                                REVIEW: review,
                                            };
                                            this.addDetailsToModel(details);
                                        }
                                    }.bind(this)
                                });
                            } else {
                                // Add details to model
                                var details = {
                                    CONSULTANCY_CATEGORY: category,
                                    DOCTOR_NAME: doctor,
                                    PATIENT_ID: patientId,
                                    MEDICAL_STORE: hospitalStore,
                                    HOSPITAL_LOCATION: hospitalLocation,
                                    // hospitalLocationOther: hospitalLocationOther,
                                    BILL_DATE: billdate,
                                    BILL_NO: billNo,
                                    BILL_AMOUNT: billAmount,
                                    DISCOUNT: discount,
                                    REQUESTED_AMOUNT: data.value.finalAmount,
                                    REVIEW: review,
                                };
                                this.addDetailsToModel(details);
                            }
                        } else {
                            // Category not found, directly add details
                            // Add details to model
                            var details = {
                                CONSULTANCY_CATEGORY: category,
                                DOCTOR_NAME: doctor,
                                PATIENT_ID: patientId,
                                MEDICAL_STORE: hospitalStore,
                                HOSPITAL_LOCATION: hospitalLocation,
                                // hospitalLocationOther: hospitalLocationOther,
                                BILL_DATE: billdate,
                                BILL_NO: billNo,
                                BILL_AMOUNT: billAmount,
                                DISCOUNT: discount,
                                REQUESTED_AMOUNT: requestedAmount,
                                REVIEW: review,
                            };
                            this.addDetailsToModel(details);
                        }
                    })
                    .catch(error => {
                        // Show error message
                        MessageBox.error("Error occurred while fetching data");
                        console.error('Error:', error);
                    });
            },

            addDetailsToModel: function (details) {
                var detailsModel = this.getView().getModel("localModel");
                if (!detailsModel) {
                    detailsModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(detailsModel, "localModel");
                }
                var dataValue = detailsModel.getProperty("/dataValue") || [];
                dataValue.push(details);
                detailsModel.setProperty("/dataValue", dataValue);
                this.clearForm();
                this.updateTotalRequestedAmount();
            },


            clearForm: function () {
                this.byId("consultancycategorys").setSelectedKey("");
                this.byId("DN").setValue("");
                this.byId("ID").setValue("");
                this.byId("HospitalStore").setSelectedItem(null);
                this.byId("Hospitallocation").setSelectedItem(null);
                this.byId("HL").setValue("");
                this.byId("billdate").setValue(null);
                this.byId("billno").setValue("");
                this.byId("billamount").setValue("");
                this.byId("discount").setValue("");
                this.byId("requestamount").setValue("");
                this.byId("description").setValue("");
            },

            deletePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                // Check if any items are selected
                if (selectedItems.length === 0) {
                    MessageBox.error("Please select an item to delete.");
                    return;
                }

                var confirmationText = "Are you sure you want to delete the selected item?";
                MessageBox.confirm(confirmationText, {
                    title: "Confirmation",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function (action) {
                        if (action === MessageBox.Action.OK) {
                            // User clicked OK, proceed with deletion
                            this.deleteSelectedItems(selectedItems);
                        }
                    }.bind(this) // Ensure the proper 'this' context inside the onClose function
                });
            },

            deleteSelectedItems: function (selectedItems) {
                var detailsModel = this.getView().getModel("localModel");
                var dataValue = detailsModel.getProperty("/dataValue");

                // Remove the selected items from the array
                selectedItems.forEach(function (item) {
                    var context = item.getBindingContext("localModel");
                    var index = context.getPath().split("/").pop();
                    dataValue.splice(index, 1);
                });

                // Update the model with the modified array
                detailsModel.setProperty("/dataValue", dataValue);

                // Clear the selection in the list
                this.byId("detailsList").removeSelections();

                MessageBox.success("Selected items deleted successfully.");

                this.updateTotalRequestedAmount();
            },

            clonePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                // Check if any items are selected
                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to clone.");
                    return;
                }

                // Get the context of the selected item
                var selectedContext = selectedItems[0].getBindingContext("localModel");

                // Get the data of the selected item from the model
                var selectedData = selectedContext.getProperty();

                // Clone the data (create a shallow copy)
                var clonedData = Object.assign({}, selectedData);

                // Set the form values directly with the cloned data
                this.setFormValues(clonedData);

                MessageBox.success("Item cloned successfully.");
                // Clear the selection in the list
                this.byId("detailsList").removeSelections();

            },


            setFormValues: function (details) {
                var date = new Date(details.BILL_DATE);
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "MMM d, yyyy"
                });
                var formattedDate = oDateFormat.format(date);
                this.byId("consultancycategorys").setSelectedKey(details.CONSULTANCY_CATEGORY);
                this.byId("DN").setValue(details.DOCTOR_NAME);
                this.byId("ID").setValue(details.PATIENT_ID);
                this.byId("HospitalStore").setSelectedKey(details.MEDICAL_STORE);
                this.byId("Hospitallocation").setSelectedKey(details.HOSPITAL_LOCATION);
                // this.byId("HL").setValue(details.hospitalLocationOther);
                this.byId("billdate").setValue(formattedDate);
                this.byId("billno").setValue(details.BILL_NO);
                this.byId("billamount").setValue(details.BILL_AMOUNT);
                this.byId("discount").setValue(details.DISCOUNT);
                this.byId("requestamount").setValue(details.REQUESTED_AMOUNT);
                this.byId("description").setValue(details.REVIEW);
            },
            EditPress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to edit.");
                    return;
                }

                // Get the context of the selected item
                var selectedContext = selectedItems[0].getBindingContext("localModel");

                // Get the data of the selected item from the model
                var selectedData = selectedContext.getProperty();

                // Set the form values directly with the selected data
                this.setFormValues(selectedData);

                // Show the Update and Cancel buttons, hide the Add, Delete, Edit, Clone buttons
                this.toggleButtonsVisibility(false, true, true, false, false);

                this.updateTotalRequestedAmount();
            },
            UpdatePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to update.");
                    return;
                }

                var selectedContext = selectedItems[0].getBindingContext("localModel");

                if (!selectedContext) {
                    MessageBox.error("No data to update.");
                    return;
                }

                var selectedData = selectedContext.getObject();

                // Assuming you have form fields that represent the properties you want to update
                var updatedData = {
                    CONSULTANCY_CATEGORY: this.byId("consultancycategorys").getSelectedKey(),
                    DOCTOR_NAME: this.byId("DN").getValue(),
                    PATIENT_ID: this.byId("ID").getValue(),
                    MEDICAL_STORE: this.byId("HospitalStore").getSelectedKey(),
                    HOSPITAL_LOCATION: this.byId("Hospitallocation").getSelectedKey(),
                    // hospitalLocationOther: this.byId("HL").getValue(),
                    BILL_DATE: this.byId("billdate").getDateValue(),
                    BILL_NO: this.byId("billno").getValue(),
                    BILL_AMOUNT: this.byId("billamount").getValue(),
                    DISCOUNT: this.byId("discount").getValue(),
                    REQUESTED_AMOUNT: this.byId("requestamount").getValue(), // Include requestedAmount here
                    REVIEW: this.byId("description").getValue()
                };

                var missingFields = [];

                if (!updatedData.CONSULTANCY_CATEGORY) missingFields.push("Consultancy Category");
                if (!updatedData.DOCTOR_NAME) missingFields.push("Doctor's Name");
                if (!updatedData.PATIENT_ID) missingFields.push("Patient ID");
                if (!updatedData.MEDICAL_STORE) missingFields.push("Hospital/Medical Store");
                if (!updatedData.HOSPITAL_LOCATION) missingFields.push("Hospital Location");
                if (!updatedData.BILL_DATE) missingFields.push("Bill Date");
                if (!updatedData.BILL_NO) missingFields.push("Bill No");
                if (!updatedData.BILL_AMOUNT) missingFields.push("Bill Amount(Rs)");
                if (!updatedData.REQUESTED_AMOUNT) missingFields.push("Requested Amount");

                if (missingFields.length > 0) {
                    var errorMessage = "Please fill in the following required fields:\n" + missingFields.join("\n");
                    MessageBox.error(errorMessage);
                    return;
                }

                // Perform server-side validation
                var startDate = this.byId("startDatePicker1").getDateValue();
                var startDate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(startDate);
                var endDate = this.byId("endDatePicker1").getDateValue();
                var endDate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(endDate);

                var requestedAmount = updatedData.REQUESTED_AMOUNT; // Define requestedAmount here

                // Assuming you have the necessary data for validation in updatedData and selectedData
                // Call your server-side validation function
                fetch("./odata/v4/my/validations(endDate=" + endDate + ",startDate=" + startDate + ",requestedAmount=" + requestedAmount + ",category='" + updatedData.CONSULTANCY_CATEGORY + "')", {
                    method: "GET"
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        if (data.value.success) {
                            // Update requestedAmount to match finalAmount from the response
                            updatedData.requestedAmount = data.value.finalAmount;

                            // Proceed with the update if validation passes
                            // Update the existing item with the new data
                            Object.assign(selectedData, updatedData);

                            var detailsModel = this.getView().getModel("localModel");
                            var dataValue = detailsModel.getProperty("/dataValue");
                            var selectedIndex = selectedContext.getPath().split("/").pop();
                            dataValue[selectedIndex] = selectedData;
                            detailsModel.setProperty("/dataValue", dataValue);

                            // Enable form fields after updating
                            this.enableFormFields(true);

                            // Show the Add, Delete, Edit, Clone buttons, hide the Update and Cancel buttons
                            this.toggleButtonsVisibility(true, false, false, true, true);

                            // Refresh the list binding to reflect the updated data
                            this.byId("detailsList").getBinding("items").refresh();

                            MessageBox.success("Data updated successfully!\nYour Eligible Amount is " + data.value.finalAmount, {
                                onClose: function () {
                                    // Clear the form
                                    this.clearForm();
                                    this.byId("detailsList").removeSelections();
                                    this.updateTotalRequestedAmount();
                                }.bind(this)
                            });

                        } else {
                            // Category not found, directly update it without validation
                            // Update the existing item with the new data
                            Object.assign(selectedData, updatedData);

                            var detailsModel = this.getView().getModel("localModel");
                            var dataValue = detailsModel.getProperty("/dataValue");
                            var selectedIndex = selectedContext.getPath().split("/").pop();
                            dataValue[selectedIndex] = selectedData;
                            detailsModel.setProperty("/dataValue", dataValue);

                            // Enable form fields after updating
                            this.enableFormFields(true);

                            // Show the Add, Delete, Edit, Clone buttons, hide the Update and Cancel buttons
                            this.toggleButtonsVisibility(true, false, false, true, true);

                            // Refresh the list binding to reflect the updated data
                            this.byId("detailsList").getBinding("items").refresh();

                            MessageBox.success("Data updated successfully!", {
                                onClose: function () {
                                    // Clear the form
                                    this.clearForm();
                                    this.byId("detailsList").removeSelections();
                                    this.updateTotalRequestedAmount();
                                }.bind(this)
                            });
                        }
                    }.bind(this))
                    .catch(function (error) {
                        // Error occurred while fetching data or processing the validation
                        MessageBox.error("Error occurred while fetching or processing validation data");
                        console.error('Error:', error);
                    });
            },




            CancelPress: function () {
                // Disable form fields after canceling
                this.setFormValues(false);

                // Clear the selection in the list
                this.byId("detailsList").removeSelections();

                // Show the Add, Delete, Edit, Clone buttons, hide the Update and Cancel buttons
                this.toggleButtonsVisibility(true, false, false, true, true);

                MessageBox.success("Editing canceled.");
            },

            enableFormFields: function (enable) {
                // Enable or disable form fields based on the 'enable' parameter
                var formFields = [
                    "consultancycategorys", "DN", "ID", "HospitalStore", "Hospitallocation",
                    "HL", "billdate", "billno", "billamount", "discount", "requestamount", "description"
                ];

                formFields.forEach(function (field) {
                    this.byId(field).setEnabled(enable);
                }.bind(this));
            },

            toggleButtonsVisibility: function (add, update, cancel, edit, clone) {
                // Toggle visibility of buttons
                this.byId("button").setVisible(add);
                this.byId("button2").setVisible(!update);
                this.byId("button3").setVisible(edit);
                this.byId("buttonUpdate").setVisible(update);
                this.byId("buttonCancel").setVisible(cancel);
                this.byId("button4").setVisible(clone);
            },
            handleDiscountChange: function (oEvent) {
                var oDiscountInput = oEvent.getSource();
                var oBillAmountInput = this.byId("billamount");
                var oRequestedAmountInput = this.byId("requestamount");

                var sDiscount = oDiscountInput.getValue();
                var sBillAmount = oBillAmountInput.getValue();

                // Check if Bill Amount has a value
                if (sBillAmount) {
                    var fBillAmount = parseFloat(sBillAmount);

                    if (sDiscount || sDiscount === "0") {
                        // If Discount has a value or is explicitly set to "0", calculate Requested Amount: Bill Amount - Discount
                        var fDiscount = parseFloat(sDiscount);
                        var fRequestedAmount = fBillAmount - fDiscount;
                        // Set the calculated value to the Requested Amount field
                        oRequestedAmountInput.setValue(fRequestedAmount);
                    } else {
                        // If Discount is empty, set Requested Amount to 0
                        oRequestedAmountInput.setValue(0);
                    }
                } else {
                    // Clear the Requested Amount field if Bill Amount is empty
                    oRequestedAmountInput.setValue("");
                }
            },

            handleBillAmountChange: function (oEvent) {
                var oBillAmountInput = oEvent.getSource();
                var oDiscountInput = this.byId("discount");
                var oRequestedAmountInput = this.byId("requestamount");

                var sBillAmount = oBillAmountInput.getValue();
                var sDiscount = oDiscountInput.getValue();

                if (sBillAmount) {
                    var fBillAmount = parseFloat(sBillAmount);

                    if (sDiscount || sDiscount === "0") {
                        var fDiscount = parseFloat(sDiscount);
                        var fRequestedAmount = fBillAmount - fDiscount;
                        oRequestedAmountInput.setValue(fRequestedAmount);
                    } else {
                        // If Discount is empty, set Requested Amount to Bill Amount
                        oRequestedAmountInput.setValue(fBillAmount);
                    }
                } else {
                    // Clear the Requested Amount field if Bill Amount is empty
                    oRequestedAmountInput.setValue("");
                }
            },
            onBillDateChange: function () {
                var oBillDatePicker = this.byId("billdate");
                var oStartDatePicker = this.byId("startDatePicker1");
                var oEndDatePicker = this.byId("endDatePicker1");

                var oBillDate = oBillDatePicker.getDateValue();
                var oStartDate = oStartDatePicker.getDateValue();
                var oEndDate = oEndDatePicker.getDateValue();

                // Check if Bill Date is between Claim Start Date and Claim End Date
                if (oStartDate && oEndDate && oBillDate) {
                    if (oBillDate < oStartDate || oBillDate > oEndDate) {
                        // Show error message
                        MessageBox.error("Please select Bill Date between Claim Start Date and Claim End Date");
                        // You can also set the value of the Bill Date to null or handle it as needed
                        oBillDatePicker.setDateValue(null);
                    }
                }
            },

            handleEndDateChange: function (oEvent) {
                var oEndDatePicker = oEvent.getSource();
                var oStartDatePicker = this.byId("startDatePicker1");
                var oEndDate = oEndDatePicker.getDateValue();
                var oStartDate = oStartDatePicker.getDateValue();

                if (oEndDate && oStartDate) {
                    if (oEndDate < oStartDate) {
                        // End date is before start date, show error message
                        oEndDatePicker.setValueState("Error");
                        oEndDatePicker.setValueStateText("End date should be greater than start date");
                    } else {
                        // Clear any previous error state
                        oEndDatePicker.setValueState("None");
                    }
                }
            },

            handleStartDateChange: function (oEvent) {
                var oStartDatePicker = oEvent.getSource();
                var oEndDatePicker = this.byId("endDatePicker1");
                var oStartDate = oStartDatePicker.getDateValue();
                var oEndDate = oEndDatePicker.getDateValue();

                if (oEndDate && oStartDate) {
                    if (oStartDate > oEndDate) {
                        // Start date is after end date, show error message
                        oStartDatePicker.setValueState("Error");
                        oStartDatePicker.setValueStateText("Start date should be before the end date");
                        oEndDatePicker.setValueState("Error");
                        oEndDatePicker.setValueStateText("End date should be after the start date");
                    } else {
                        // Clear any previous error state
                        oStartDatePicker.setValueState("None");
                        oEndDatePicker.setValueState("None");
                    }
                }
            },

            updateTotalRequestedAmount: function () {
                var totalRequestedAmount = 0;
                var items = this.byId("detailsList").getItems();
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var REQUESTED_AMOUNT = parseInt(item.getBindingContext("localModel").getProperty("REQUESTED_AMOUNT"));
                    totalRequestedAmount += REQUESTED_AMOUNT;
                }

                // Update the text of the label with the total requested amount
                this.byId("totalRequestedAmountLabel").setText("Total Amount: " + totalRequestedAmount);
                // this.byId("totalRequestedAmount").setText("Total Requested Amount: " + totalRequestedAmount);
                this.byId("totalRequestedAmountValue").setText(totalRequestedAmount);
            },


            validateOnlyCharacters: function (oEvent) {
                var input = oEvent.getSource();
                var value = input.getValue().trim();
                var pattern = /^[A-Za-z\s]*$/;
                var isValid = pattern.test(value);
                input.setValueState(isValid ? "None" : "Error");
                input.setValueStateText(isValid ? "" : "Only characters are allowed");
            },

            validateOnlyNumbers: function (oEvent) {
                var input = oEvent.getSource();
                var value = input.getValue().trim();
                var pattern = /^[0-9]+$/; // Regular expression to match only numbers
                var isValid = pattern.test(value);
                input.setValueState(isValid ? "None" : "Error");
                input.setValueStateText(isValid ? "" : "Only numbers are allowed");
            },

            onHospitalLocationChange: function (oEvent) {
                var selectedKey = oEvent.getSource().getSelectedKey();
                if (selectedKey === "OTHER") {
                    sap.m.MessageBox.information("Please enter Hospital Location (If Other)");
                }
            },

            onTreatmentChange: function (oEvent) {
                var selectedKey = oEvent.getSource().getSelectedKey();

                if (selectedKey === "OTHER") {
                    sap.m.MessageBox.information(" Please enter Treatment For (If Other)");
                }
            },

            // handleSubmit: function() {
            //     var that = this;
            //     var localModel = this.getView().getModel("localModel");
            //     var AD = localModel.getData();
            //     var allDetails = AD.dataValue;
            //     var id = AD.dataValue[0].ID;
            //     console.log(id);
            //     var currentDate = new Date().toISOString().split('T')[0];

            //     allDetails.forEach(function(detail) {
            //         var claim = {
            //             // ID:parseInt(detail.ID),
            //             CLAIM_ID: parseInt(AD.claimId),
            //             PERSON_NUMBER: 9000,
            //             CLAIM_TYPE: AD.claimType,
            //             CLAIM_START_DATE: new Date(AD.claimStartDate).toISOString(),
            //             CLAIM_END_DATE: new Date(AD.claimEndDate).toISOString(),
            //             TREATMENT_FOR: AD.treatmentFor,
            //             TREATMENT_FOR_IF_OTHERS: detail.treatmentForOther,
            //             TREATMENT_TYPE: AD.treatmentType,
            //             SELECT_DEPENDENTS: AD.selectedDependent,
            //             SUBMITTED_DATE: currentDate,
            //             DOCTOR_NAME: detail.DOCTOR_NAME,
            //             PATIENT_ID: detail.PATIENT_ID,
            //             HOSPITAL_LOCATION: detail.HOSPITAL_LOCATION,
            //             REQUESTED_AMOUNT: parseFloat(detail.REQUESTED_AMOUNT),
            //             CONSULTANCY_CATEGORY: detail.CONSULTANCY_CATEGORY,
            //             MEDICAL_STORE: detail.MEDICAL_STORE,
            //             BILL_DATE: new Date(detail.BILL_DATE).toISOString(),
            //             BILL_NO: detail.BILL_NO,
            //             BILL_AMOUNT: parseFloat(detail.BILL_AMOUNT),
            //             DISCOUNT: parseFloat(detail.DISCOUNT),
            //             REVIEW: detail.REVIEW,
            //             APPROVED_AMOUNT: 0
            //         };

            //         if (!isNaN(claim.CLAIM_ID) && typeof claim.CLAIM_ID !== 'undefined') {
            //             updateClaimData(claim, id);
            //         } else {
            //             fetchMaxClaimId()
            //                 .then(maxClaimId => {
            //                     claim.CLAIM_ID = maxClaimId + 1;
            //                     saveClaimData(claim);
            //                 })
            //                 .catch(error => {
            //                     handleError(error);
            //                 });
            //         }

            //     });

            //     function updateClaimData(claim, id) {
            //         $.ajax({
            //             url: '/odata/v4/my/CLAIM_DETAILS/' + id,
            //             type: 'PATCH',
            //             contentType: 'application/json',
            //             data: JSON.stringify(claim),
            //             success: function(response) {
            //                 showMessageAndNavigate("Claim data updated successfully!");
            //             },
            //             error: function(xhr, status, error) {
            //                 handleError(xhr, status, error);
            //             }
            //         });
            //     }

            //     function saveClaimData(claim) {
            //         $.ajax({
            //             url: '/odata/v4/my/CLAIM_DETAILS',
            //             type: 'POST',
            //             contentType: 'application/json',
            //             data: JSON.stringify(claim),
            //             success: function(response) {
            //                 showMessageAndNavigate("Claim data saved successfully!");
            //             },
            //             error: function(xhr, status, error) {
            //                 handleError(xhr, status, error);
            //             }
            //         });
            //     }

            //     function fetchMaxClaimId() {
            //         return fetch("./odata/v4/my/CLAIM_DETAILS?$orderby=CLAIM_ID desc&$top=1")
            //             .then(response => {
            //                 if (!response.ok) {
            //                     throw new Error('Failed to fetch maximum CLAIM_ID');
            //                 }
            //                 return response.json();
            //             })
            //             .then(data => {
            //                 return data.value[0].CLAIM_ID;
            //             });
            //     }

            //     function showMessageAndNavigate(message) {
            //         sap.m.MessageBox.success(message, {
            //             onClose: function() {
            //                 var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
            //                 oRouter.navTo("Login");
            //                 window.location.reload();
            //             },
            //         });
            //     }

            //     function handleError(xhr, status, error) {
            //         var errorMessage = "Error: " + error;
            //         if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) {
            //             errorMessage += "\n" + xhr.responseJSON.error.message;
            //         }
            //         sap.m.MessageBox.error(errorMessage, {
            //             onClose: function() {
            //                 // Handle error closing if needed
            //             },
            //         });
            //     }
            // },

            handleSubmit: function () {
                var that = this;
                var localModel = this.getView().getModel("localModel");
                var AD = localModel.getData();
                var allDetails = AD.dataValue;
                var id = AD.dataValue[0].ID;
                var currentDate = new Date().toISOString().split('T')[0];
                var promises = [];

                allDetails.forEach(function (detail) {
                    var claim = {
                        CLAIM_ID: parseInt(AD.claimId),
                        PERSON_NUMBER: 9000,
                        CLAIM_TYPE: AD.claimType,
                        // CLAIM_START_DATE: formatDateToISO(AD.claimStartDate),
                        // CLAIM_END_DATE: formatDateToISO(AD.claimEndDate),
                        CLAIM_START_DATE: new Date(AD.claimStartDate).toISOString(),
                        CLAIM_END_DATE: new Date(AD.claimEndDate).toISOString(),
                        TREATMENT_FOR: AD.treatmentFor,
                        TREATMENT_FOR_IF_OTHERS: detail.treatmentForOther,
                        TREATMENT_TYPE: AD.treatmentType,
                        SELECT_DEPENDENTS: AD.selectedDependent,
                        SUBMITTED_DATE: currentDate,
                        DOCTOR_NAME: detail.DOCTOR_NAME,
                        PATIENT_ID: detail.PATIENT_ID,
                        HOSPITAL_LOCATION: detail.HOSPITAL_LOCATION,
                        REQUESTED_AMOUNT: parseFloat(detail.REQUESTED_AMOUNT),
                        CONSULTANCY_CATEGORY: detail.CONSULTANCY_CATEGORY,
                        MEDICAL_STORE: detail.MEDICAL_STORE,
                        BILL_DATE: new Date(detail.BILL_DATE).toISOString(),
                        BILL_NO: detail.BILL_NO,
                        BILL_AMOUNT: parseFloat(detail.BILL_AMOUNT),
                        DISCOUNT: parseFloat(detail.DISCOUNT),
                        REVIEW: detail.REVIEW,
                        APPROVED_AMOUNT: 0,

                    };

                    var promise = !isNaN(claim.CLAIM_ID) && typeof claim.CLAIM_ID !== 'undefined' ?
                        updateClaimData(claim, detail.ID) :
                        fetchMaxClaimId()
                            .then(maxClaimId => {
                                claim.CLAIM_ID = maxClaimId + 1;
                                return saveClaimData(claim);
                            })
                            .catch(error => {
                                throw error; // Propagate the error
                            });

                    promises.push(promise);
                });

                Promise.all(promises)
                    .then(function () {
                        showMessageAndNavigate("Claim updated or saved successfully!");
                    })
                    .catch(function (error) {
                        handleError(error);
                    });

                function updateClaimData(claim, id) {
                    console.time("Update claim");
                    // Set status to "Submitted"
                    claim.STATUS = "Submitted";
                    return fetch('/odata/v4/my/CLAIM_DETAILS/' + id, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(claim)
                    })
                        .then(response => {
                            console.timeEnd('Update claim');
                            if (!response.ok) {
                                throw new Error('Failed to update claim data');
                            }
                            // Update status in local model as well if needed
                            var localModel = that.getView().getModel("localModel");
                            var AD = localModel.getData();
                            var allDetails = AD.dataValue;
                            allDetails.forEach(detail => {
                                if (detail.ID === id) {
                                    detail.STATUS = "Submitted";
                                }
                            });
                            localModel.setData(AD);
                        });
                }

                function saveClaimData(claim) {
                    return fetch('/odata/v4/my/CLAIM_DETAILS', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(claim)
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to save claim data');
                            }
                        });
                }


                function fetchMaxClaimId() {
                    return fetch("./odata/v4/my/CLAIM_DETAILS?$orderby=CLAIM_ID desc&$top=1")
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch maximum CLAIM_ID');
                            }
                            return response.json();
                        })
                        .then(data => {
                            return data.value[0].CLAIM_ID;
                        });
                }

                function showMessageAndNavigate(message) {
                    sap.m.MessageBox.success(message, {
                        onClose: function () {
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                            oRouter.navTo("Login");
                            window.location.reload();
                        },
                    });
                }

                function handleError(error) {
                    var errorMessage = "Error: " + error;
                    sap.m.MessageBox.error(errorMessage, {
                        onClose: function () {
                            // Handle error closing if needed
                        },
                    });
                }

                // function formatDateToISO(date) {
                //     let [day, month, year] = date.split("/");
                //     var claimDate = new Date();
                //     claimDate.setFullYear(year);
                //     claimDate.setMonth(parseInt(month) - 1);
                //     claimDate.setDate(day);

                //     // Convert the combined date string to ISO format
                //     return claimDate.toISOString();
                // }
            },


            onTableUpdate: function () {
                var oTable = this.getView().byId("reporttable");
                var oItems = oTable.getItems();

                oItems.forEach(function (oItem) {
                    var oStatus = oItem.getBindingContext("MainModel").getProperty("STATUS");
                    var oButton = oItem.getCells()[oItem.getCells().length - 1];

                    if (oStatus === "Claim sent back to employee") {
                        oButton.setEnabled(true);
                    } else {
                        oButton.setEnabled(false);
                    }
                });
            },

            onCustomerPress: function (oEvent) {
                var oButton = oEvent.getSource();
                var sClaimId = oButton.getBindingContext("MainModel").getProperty("CLAIM_ID");

                // Store sClaimId as a property of the controller
                this._sClaimId = sClaimId;

                this.onOpenDialog(sClaimId);
            },

            onOpenDialog: function (sClaimId) {
                var oView = this.getView();
                var oDialog = oView.byId("manage");
                var that = this; // Store 'this' reference
                var sUrl = "./odata/v4/my/ZHRMEDICLAIM?$filter=REFNR eq " + sClaimId;

                // Get owner component
                var oOwnerComponent = sap.ui.core.Component.getOwnerComponentFor(this);

                fetch(sUrl)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        console.log("Data:", data);
                        if (data && data.value && data.value.length > 0) {
                            var claimData = data.value[0];

                            if (!oDialog) {
                                oDialog = sap.ui.xmlfragment(oView.getId(), "claim.fragments.manage", that);
                                oView.addDependent(oDialog);
                            }

                            // Set values to UI elements
                            oDialog.setTitle("Claim ID: " + sClaimId);
                            oDialog.open();
                            oView.byId("batchno").setValue(claimData.BATCH_NO);
                            oView.byId("documentstatus").setValue(claimData.STATUS);
                            // oView.byId("nia").setValue(claimData.NIA_DATE);
                            // oView.byId("settlementdate").setValue(claimData.SETTLEMENT_DATE);
                            var niaDate = new Date(claimData.NIA_DATE);
                            var formattedNiaDate = niaDate.toISOString().split('T')[0];
                            oView.byId("nia").setValue(formattedNiaDate);
                            var settlementDate = new Date(claimData.SETTLEMENT_DATE);
                            var formattedSettlementDate = settlementDate.toISOString().split('T')[0];
                            oView.byId("settlementdate").setValue(formattedSettlementDate);
                            oView.byId("bankname").setValue(claimData.BANK_NAME);
                            oView.byId("chequeno").setValue(claimData.CHECK_NO);
                            oView.byId("hlremarks").setValue(claimData.HR_REMARKS);
                            oView.byId("approved").setValue(claimData.APPROVED_AMOUNT);
                        } else {
                            if (!oDialog) {
                                oDialog = sap.ui.xmlfragment(oView.getId(), "claim.fragments.manage", that);
                                oView.addDependent(oDialog);
                            }
                            oDialog.setTitle("Claim ID: " + sClaimId);
                            oDialog.open();

                            oView.byId("documentstatus").setValue("Submitted");
                        }
                    })
                    .catch(function (error) {
                        console.error("Error:", error);
                        sap.m.MessageBox.error("Error retrieving data for Claim ID: " + sClaimId);
                    });
            },


            onCloseFrag: function () {
                var oView = this.getView();
                var oDialog = oView.byId("manage");

                // Clearing input fields
                oView.byId("batchno").setValue("");
                oView.byId("documentstatus").setSelectedKey("");
                oView.byId("nia").setValue("");
                oView.byId("settlementdate").setValue("");
                oView.byId("bankname").setValue("");
                oView.byId("chequeno").setValue("");
                oView.byId("hlremarks").setValue("");
                oView.byId("approved").setValue("");

                if (oDialog) {
                    oDialog.close();
                }
            },



            onSaveFrag: function () {
                var oView = this.getView();
                var oDialog = oView.byId("manage");
                var sClaimId = this._sClaimId;

                // Check if sClaimId is not null or undefined
                if (sClaimId) {
                    // Parse sClaimId as an integer
                    var iClaimId = parseInt(sClaimId);

                    // Get all input values
                    var sBatchNo = oView.byId("batchno").getValue();
                    var sDocumentStatus = oView.byId("documentstatus").getValue();
                    var sBankName = oView.byId("bankname").getValue();
                    var sChequeNo = oView.byId("chequeno").getValue();
                    var sHLRemarks = oView.byId("hlremarks").getValue();
                    var sApprovedAmount = oView.byId("approved").getValue();

                    // Get the settlement date value as a timestamp (in milliseconds)
                    var nSettlementTimestamp = Date.now();
                    var sSettlementDateISO = new Date(nSettlementTimestamp).toISOString();

                    // Get the NIA date as a timestamp (in milliseconds)
                    var nNia = Date.now();
                    var sNiaISO = new Date(nNia).toISOString();

                    // Default Approved amount to 0 if not provided
                    if (!sApprovedAmount) {
                        sApprovedAmount = 0;
                    } else {
                        // Ensure Approved amount is a valid integer
                        if (isNaN(parseInt(sApprovedAmount))) {
                            throw new Error("Invalid Approved amount");
                        }
                        sApprovedAmount = parseInt(sApprovedAmount);
                    }

                    var oPayloadZHRMEDICLAIM = {
                        REFNR: iClaimId,
                        SETTLEMENT_DATE: sSettlementDateISO,
                        HR_REMARKS: sHLRemarks,
                        NIA_DATE: sNiaISO,
                        CHECK_NO: sChequeNo,
                        BATCH_NO: sBatchNo,
                        BANK_NAME: sBankName,
                        STATUS: sDocumentStatus,
                        APPROVED_AMOUNT: sApprovedAmount
                    };

                    // Check for mandatory fields based on document status
                    if (sDocumentStatus === "Claim Settled") {
                        // Check if any mandatory fields are missing
                        if (!sApprovedAmount || !sBankName || !sChequeNo || !sSettlementDateISO) {
                            sap.m.MessageBox.error("Please fill in all mandatory fields");
                            return;
                        }
                    } else if (sDocumentStatus === "Rejected") {
                        // Check if any mandatory fields are missing
                        if (!sHLRemarks) {
                            sap.m.MessageBox.error("Please fill in all mandatory fields");
                            return;
                        }
                    }

                    // Check if the REFNR exists using fetch
                    fetch("./odata/v4/my/statusUpdate(REFNR=" + iClaimId + ",Status='" + sDocumentStatus + "',Batch='" + sBatchNo + "',Nia='" + sNiaISO + "',Remark='" + sHLRemarks + "',Check='" + sChequeNo + "',Bank='" + sBankName + "',Approved=" + sApprovedAmount + ",Settlement='" + sSettlementDateISO + "')"
                    )
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (data) {
                            if (data.success) {
                                // If REFNR exists, update the status
                                fetch("./odata/v4/my/statusUpdate(REFNR=" + iClaimId + ",Status='" + sDocumentStatus + "',Batch='" + sBatchNo + "',Nia='" + sNiaISO + "',Remark='" + sHLRemarks + "',Check='" + sChequeNo + "',Bank='" + sBankName + "',Approved=" + sApprovedAmount + ",Settlement='" + sSettlementDateISO + "')", {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({})
                                })
                                    .then(function (response) {
                                        console.log(response);
                                        sap.m.MessageBox.success("Claim status updated successfully", {
                                            onClose: function () {
                                                // Clear forms
                                                oView.byId("batchno").setValue("");
                                                oView.byId("documentstatus").setValue("");
                                                oView.byId("bankname").setValue("");
                                                oView.byId("chequeno").setValue("");
                                                oView.byId("hlremarks").setValue("");
                                                oView.byId("settlementdate").setValue("");
                                                oView.byId("nia").setValue("");
                                                oView.byId("approved").setValue("");

                                                oDialog.close();

                                                location.reload();
                                                // Navigate back to detail2
                                                var oRouter = sap.ui.core.UIComponent.getRouterFor(oView);
                                                oRouter.navTo("detail2");
                                            }
                                        });
                                    })
                                    .catch(function (error) {
                                        console.error('Error occurred during status update:', error);
                                        sap.m.MessageBox.error("Failed to update claim status");
                                    });
                            } else {
                                // If REFNR does not exist, save the data
                                fetch("./odata/v4/my/ZHRMEDICLAIM", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify(oPayloadZHRMEDICLAIM)
                                })
                                    .then(function () {
                                        sap.m.MessageBox.success("Claim ID " + iClaimId + " : Data saved successfully", {
                                            onClose: function () {
                                                // Clear forms
                                                oView.byId("batchno").setValue("");
                                                oView.byId("documentstatus").setValue("");
                                                oView.byId("bankname").setValue("");
                                                oView.byId("chequeno").setValue("");
                                                oView.byId("hlremarks").setValue("");
                                                oView.byId("settlementdate").setValue("");
                                                oView.byId("nia").setValue("");
                                                oView.byId("approved").setValue("");

                                                oDialog.close();

                                                location.reload();
                                                // Navigate back to detail2
                                                var oRouter = sap.ui.core.UIComponent.getRouterFor(oView);
                                                oRouter.navTo("detail2");
                                            }
                                        });
                                    })
                                    .catch(function () {
                                        sap.m.MessageBox.error("Failed to save data in ZHRMEDICLAIM");
                                    });
                            }
                        })
                        .catch(function (error) {
                            sap.m.MessageBox.error("Failed to check REFNR");
                        });
                } else {
                    // Handle the case where sClaimId is null or undefined
                    sap.m.MessageBox.error("Invalid Claim ID");
                }
            },


            onStatusChange: function (oEvent) {
                var sDocumentStatus = oEvent.getSource().getSelectedItem().getText();
                var oBankDetails = this.getView().byId("bankname");
                var oChequeNumber = this.getView().byId("chequeno");
                var oSettledDate = this.getView().byId("settlementdate");
                var oApprovedAmount = this.getView().byId("approved");
                var oHLRemarks = this.getView().byId("hlremarks");

                switch (sDocumentStatus) {
                    case "Rejected":
                        oBankDetails.setEnabled(false);
                        oChequeNumber.setEnabled(false);
                        oSettledDate.setEnabled(false);
                        oApprovedAmount.setEnabled(false);
                        oHLRemarks.setRequired(true);
                        break;
                    case "Claim Settled":
                        oBankDetails.setEnabled(true);
                        oChequeNumber.setEnabled(true);
                        oSettledDate.setEnabled(true);
                        oApprovedAmount.setEnabled(true);
                        oHLRemarks.setEnabled(true);
                        break;
                    case "Claim sent back to employee":
                        oBankDetails.setEnabled(false);
                        oChequeNumber.setEnabled(false);
                        oSettledDate.setEnabled(false);
                        oApprovedAmount.setEnabled(false);
                        oHLRemarks.setRequired(true);
                        break;
                    default:
                        // Other statuses
                        oBankDetails.setEnabled(false);
                        oChequeNumber.setEnabled(false);
                        oSettledDate.setEnabled(false);
                        oApprovedAmount.setEnabled(false);
                        oHLRemarks.setEnabled(false);
                        break;
                }
            },

            onSearch: function (event) {
                var searchString = event.getParameter("newValue");
                var oTable = this.getView().byId("managetable");
                var aItems = oTable.getItems(); // Get all items from the table

                // Apply search filter
                if (searchString) {
                    searchString = searchString.toLowerCase(); // Convert search string to lowercase for case-insensitive search

                    // Iterate over each item and apply the filter
                    aItems.forEach(function (oItem) {
                        var bVisible = false; // Flag to track item visibility

                        // Get cells of the item and check if any text matches the search string
                        oItem.getCells().forEach(function (oCell) {
                            var cellText = oCell.getText().toLowerCase(); // Convert cell text to lowercase
                            if (cellText.includes(searchString)) {
                                bVisible = true; // Set flag to true if search string is found
                            }
                        });

                        // Set item visibility based on the flag
                        oItem.setVisible(bVisible);
                    });
                } else {
                    // If search string is empty, make all items visible
                    aItems.forEach(function (oItem) {
                        oItem.setVisible(true);
                    });
                }
            },

            onSearchClaim: function (event) {
                var searchString = event.getParameter("newValue");
                var oTable = this.getView().byId("reporttable");
                var aItems = oTable.getItems(); // Get all items from the table

                // Apply search filter
                if (searchString) {
                    searchString = searchString.toLowerCase(); // Convert search string to lowercase for case-insensitive search

                    // Iterate over each item and apply the filter
                    aItems.forEach(function (oItem) {
                        var bVisible = false; // Flag to track item visibility

                        // Get cells of the item and check if any text matches the search string
                        oItem.getCells().forEach(function (oCell) {
                            var cellText = oCell.getText().toLowerCase(); // Convert cell text to lowercase
                            if (cellText.includes(searchString)) {
                                bVisible = true; // Set flag to true if search string is found
                            }
                        });

                        // Set item visibility based on the flag
                        oItem.setVisible(bVisible);
                    });
                } else {
                    // If search string is empty, make all items visible
                    aItems.forEach(function (oItem) {
                        oItem.setVisible(true);
                    });
                }
            },

            //check box code//
            onAcceptCheckBoxSelect: function (oEvent) {
                var bSelected = oEvent.getParameter("selected");

                if (bSelected) {
                    this.openAcceptMessageBox();
                } else {
                }
            },

            // Function to open the MessageBox
            openAcceptMessageBox: function () {
                var that = this;

                MessageBox.confirm(
                    "Are you sure you want to accept the terms and conditions?",
                    {
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.OK) {
                                that.getView().byId("Accept").setSelected(true);
                            } else {
                                that.getView().byId("Accept").setSelected(false);
                            }
                        }
                    }
                );
            },


            //UPLOAD START FROM HERE//
            onBeforeInitiatingItemUpload: function (oEvent) {
                var oUploadSetTableInstance = this.byId("UploadSetTable");
                var oItem = oEvent.getParameter("item");

                /** Demonstration of Updating the Document without file with actual file.
                 * Note:- This is just a demonstration of an idea of how the feature can be achieved by setting the header field data of an empty documentId on the UploadSetwithTableItem instance.
                 * Please check mockserver.js for the logic to simulate how the empty document is updated with the file selected for upload using the existing document id.
                 */
                var oSelectedItems = oUploadSetTableInstance.getSelectedItems();
                var oSelectedItemForUpdate = oSelectedItems.length === 1 ? oSelectedItems[0] : null;
                if (oSelectedItemForUpdate && oSelectedItemForUpdate.getFileName() === "-") {
                    if (oSelectedItemForUpdate) {
                        var oContext = oSelectedItemForUpdate.getBindingContext();
                        var data = oContext && oContext.getObject ? oContext.getObject() : {};
                        oItem.addHeaderField(new sap.m.UploadCollectionParameter({
                            name: "existingDocumentID",
                            value: data ? data.id : ""
                        }));
                    }
                }
            },



            // UploadCompleted event handler
            onUploadCompleted: function (oEvent) {
                var oModel = this.getView().getModel();
                var iResponseStatus = oEvent.getParameter("File Id");

                // check for upload is sucess
                if (iResponseStatus === 201) {
                    oModel.refresh(true);
                    setTimeout(function () {
                        MessageToast.show("Document Added");
                    }, 1000);
                }
            },

            getIconSrc: function (mediaType, thumbnailUrl) {
                return UploadSetwithTable.getIconForFileType(mediaType, thumbnailUrl);
            },

            getFileCategories: function () {
                return [
                    { categoryId: "Test Report", categoryText: "Test Report" },
                    { categoryId: "Document Prescription", categoryText: "Document Prescription" },
                    { categoryId: "Original Bill", categoryText: "Original Bill" },
                ];
            },
            onRemoveHandler: function (oEvent) {
                var clickedControl = oEvent.getSource();
                var olistItemTobeRemoved = null;

                // Traverse up the control hierarchy to find the ColumnListItem
                while (clickedControl && !(clickedControl instanceof UploadSetwithTableItem)) {
                    clickedControl = clickedControl.getParent();
                }

                if (clickedControl instanceof UploadSetwithTableItem) {
                    olistItemTobeRemoved = clickedControl;
                }
                this.removeItem(olistItemTobeRemoved);
            },
            removeItem: function (oItem) {
                var oModel = this.getView().getModel();
                var oUploadSet = this.byId("UploadSetTable");
                MessageBox.warning(
                    "Are you sure you want to remove the document" + " " + oItem.getFileName() + " " + "?",
                    {
                        icon: MessageBox.Icon.WARNING,
                        actions: ["Remove", MessageBox.Action.CANCEL],
                        emphasizedAction: "Remove",
                        styleClass: "sapMUSTRemovePopoverContainer",
                        initialFocus: MessageBox.Action.CANCEL,
                        onClose: function (sAction) {
                            if (sAction !== "Remove") {
                                return;
                            }
                            var spath = oItem.getBindingContext().sPath;
                            if (spath.split("/")[2]) {
                                var index = spath.split("/")[2];
                                var data = oModel.getProperty("/items");
                                data.splice(index, 1);
                                oModel.refresh(true);
                                if (oUploadSet && oUploadSet.removeSelections) {
                                    oUploadSet.removeSelections();
                                }
                            }
                        }
                    }
                );
            },
            handleRemove: function (oEvent) {
                var oSource = oEvent.getSource();
                var oItemInstance = oSource.data().item;
                var fnReject = oSource.data().reject;
                var oFragmentModel = this._fileUploadFragment.getModel();
                var oSelectedItems = oFragmentModel.getData().selectedItems;
                var iSelectedItemIndex = oSelectedItems.findIndex(function (oItem) {
                    return oItem.itemInstance.getId() === oItemInstance.getId();
                });
                oSelectedItems.splice(iSelectedItemIndex, 1);
                this._oFilesTobeuploaded.splice(iSelectedItemIndex, 1);
                var oModel = new JSONModel({
                    "selectedItems": oSelectedItems,
                    "types": this.documentTypes

                });
                this._fileUploadFragment.setModel(oModel);

                // cancel the upload of the current item selected for upload.
                fnReject(oItemInstance);
            },
            uploadFilesHandler: function () {
                var oUploadSetTableInstance = this.byId("UploadSetTable");

                oUploadSetTableInstance.fileSelectionHandler();
            },

            uploadFile: function (itemInstance, fileCategorySelected) {
                var oFile = itemInstance.getFileObject();
                var sUrl = "https://api-sdm-di.cfapps.eu10.hana.ondemand.com/browser/0648bb78-88ca-4e7d-a999-087eecf8fbe4/root/MEDICAL CLAIM/TEST REPORT/";

                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("category", fileCategorySelected);

                fetch(sUrl, {
                    method: "POST",
                    body: oFormData
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        MessageToast.show("File uploaded successfully");
                    })
                    .catch(function (error) {
                        MessageToast.show("File upload failed: " + error.message);
                    });
            },

            onDocumentTypeChange: function (oEvent) {
                var oComboBox = oEvent.getSource();
                var sSelectedKey = oComboBox.getSelectedKey();
                var oBindingContext = oComboBox.getBindingContext();
                var oModel = oBindingContext.getModel();

                oModel.setProperty(oBindingContext.getPath() + "/fileCategorySelected", sSelectedKey);
            },
            //open fragment
            openFileUploadDialog: function () {
                var items = this.oItemsProcessor;

                if (items && items.length) {
                    this._oFilesTobeuploaded = items;

                    var oItemsMap = this._oFilesTobeuploaded.map(function (oItemProcessor) {
                        return {
                            fileName: oItemProcessor.item.getFileName(),
                            fileCategorySelected: this.documentTypes[0].categoryId,
                            itemInstance: oItemProcessor.item,
                            fnResolve: oItemProcessor.resolve,
                            fnReject: oItemProcessor.reject
                        };
                    }.bind(this));

                    var oModel = new JSONModel({
                        "selectedItems": oItemsMap,
                        "types": this.documentTypes
                    });

                    if (!this._fileUploadFragment) {
                        Fragment.load({
                            name: "claim.fragments.FileUpload",
                            id: this.getView().getId() + "-file-upload-dialog",
                            controller: this
                        })
                            .then(function (oPopover) {
                                this._fileUploadFragment = oPopover;
                                this.getView().addDependent(oPopover);
                                oPopover.setModel(oModel);
                                oPopover.open();
                            }.bind(this));
                    } else {
                        this._fileUploadFragment.setModel(oModel);
                        this._fileUploadFragment.open();
                    }
                }
            },
            getFileSizeWithUnits: function (iFileSize) {
                return UploadSetwithTable.getFileSizeWithUnits(iFileSize);
            },

            openPreview: function (oEvent) {
                var clickedControl = oEvent.getSource();
                while (clickedControl && !(clickedControl instanceof UploadSetwithTableItem)) {
                    clickedControl = clickedControl.getParent();
                }
                clickedControl.openPreview();
            },
            closeFileUplaodFragment: function () {
                this._fileUploadFragment.destroy();
                this._fileUploadFragment = null;
                this._oFilesTobeuploaded = [];
                this.oItemsProcessor = [];
            },
            onSelectionChange: function (oEvent) {
                var oTable = oEvent.getSource();
                var aSelectedItems = oTable.getSelectedItems();
                var oDownloadBtn = this.byId("downloadSelectedButton");
                var oEditUrlBtn = this.byId("editUrlButton");
                var oRenameBtn = this.byId("renameButton");
                var oRemoveDocumentBtn = this.byId("removeDocumentButton");

                if (aSelectedItems.length > 0) {
                    oDownloadBtn.setEnabled(true);
                } else {
                    oDownloadBtn.setEnabled(false);
                }
                if (aSelectedItems.length === 1) {
                    oEditUrlBtn.setEnabled(true);
                    oRenameBtn.setEnabled(true);
                    oRemoveDocumentBtn.setEnabled(true);
                } else {
                    oRenameBtn.setEnabled(false);
                    oEditUrlBtn.setEnabled(false);
                    oRemoveDocumentBtn.setEnabled(false);
                }
            },
            // Download files handler
            onDownloadFiles: function (oEvent) {
                var oUploadSet = this.byId("UploadSetTable");
                const oItems = oUploadSet.getSelectedItems();

                oItems.forEach((oItem) => { oItem.download(true); });
            },
            handleConfirmation: function () {
                var oData = this._fileUploadFragment.getModel().getData();
                var oSelectedItems = oData.selectedItems;

                if (oSelectedItems && oSelectedItems.length) {
                    oSelectedItems.forEach(function (oItem) {
                        var oItemToUploadRef = oItem.itemInstance;
                        // setting the header field for custom document type selected
                        oItemToUploadRef.addHeaderField(new CoreItem({
                            key: "documentType",
                            text: oItem.fileCategorySelected
                        }));
                        oItem.fnResolve(oItemToUploadRef);
                    });
                }
                this._fileUploadFragment.destroy();
                this._fileUploadFragment = null;
                this._oFilesTobeuploaded = [];
                this.oItemsProcessor = [];
            },

            itemValidationCallback: function (oItemInfo) {
                const { oItem, iTotalItemsForUpload } = oItemInfo;
                var oUploadSetTableInstance = this.byId("UploadSetTable");
                var oSelectedItems = oUploadSetTableInstance.getSelectedItems();
                var oSelectedItemForUpdate = oSelectedItems.length === 1 ? oSelectedItems[0] : null;
                if (oSelectedItemForUpdate && oSelectedItemForUpdate.getFileName() === "-" && iTotalItemsForUpload === 1) {
                    return new Promise((resolve) => {
                        if (oSelectedItemForUpdate) {
                            var oContext = oSelectedItemForUpdate.getBindingContext();
                            var data = oContext && oContext.getObject ? oContext.getObject() : {};

                            /* Demonstration use case of Setting the header field if required to be passed in API request headers to
                               inform backend with document type captured through user input */
                            oItem.addHeaderField(new CoreItem(
                                {
                                    key: "existingDocumentID",
                                    text: data ? data.id : ""
                                }
                            ));
                        }
                        resolve(oItem);
                    });
                } else {
                    var oItemPromise = new Promise((resolve, reject) => {
                        this.oItemsProcessor.push({
                            item: oItem,
                            resolve: resolve,
                            reject: reject
                        });
                    });
                    if (iTotalItemsForUpload === 1) {
                        this.openFileUploadDialog();
                    } else if (iTotalItemsForUpload === this.oItemsProcessor.length) {
                        this.openFileUploadDialog();
                    }
                    return oItemPromise;
                }
            },


            onBeforeUploadStarts: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                var oXhr = oEvent.getParameter("request");

                // Fetch the token (ensure this token fetching logic is executed appropriately in your application)
                fetchOAuthToken().then(function (token) {
                    oXhr.setRequestHeader("Authorization", "Bearer " + token);
                    oXhr.setRequestHeader("Content-Type", "application/json");

                    // Modify request URL if necessary
                    var sUrl = "https://api-sdm-di.cfapps.eu10.hana.ondemand.com/browser/0648bb78-88ca-4e7d-a999-087eecf8fbe4/root/MEDICAL CLAIM/TEST REPORT/";
                    oXhr.open("POST", sUrl, true);
                }).catch(function (error) {
                    console.error("Failed to fetch token", error);
                    // Handle the error appropriately in your application
                });
            },
            fetchOAuthToken: function () {
                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", "https://development-aarini.authentication.eu10.hana.ondemand.com/oauth/token");
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                    // Client credentials
                    var clientId = "sb-4c81044e-143b-4176-9913-48795aef851c!b153074|sdm-di-SDM_DI_PROD-prod!b41064";
                    var clientSecret = "BSUo6IhaMamfbkYw9BA4y/CO+m0=";
                    var params = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;

                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            var response = JSON.parse(xhr.responseText);
                            resolve(response.access_token);
                        } else {
                            reject(new Error("Failed to fetch token"));
                        }
                    };
                    xhr.onerror = function () {
                        reject(new Error("Network error"));
                    };
                    xhr.send(params);
                });
            },
            onCreate: function () {
                var oView = this.getView();
                var oDialog = oView.byId("create");

                // If the dialog doesn't exist, create it
                if (!oDialog) {
                    // Load the fragment
                    oDialog = sap.ui.xmlfragment(oView.getId(), "claim.fragments.create", this);
                    oView.addDependent(oDialog);
                }

                // Open the dialog
                oDialog.open();
            },

            onClosecreate: function () {
                var oView = this.getView();
                var oDialog = oView.byId("create");
                oView.byId("folder").setValue("");
                if (oDialog) {
                    oDialog.close();
                }
            },

            onSavecreate: function () {
                var oView = this.getView();
                var oDialog = oView.byId("create");

                // Get folder name input
                var sFolder = oView.byId("folder").getValue();

                // Check if the folder exists
                fetch("./odata/v4/my/DMS_ATT", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error('Failed to create folder');
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        if (data.value.folderExists) {
                            sap.m.MessageBox.information("Folder already exists");
                        } else {
                            // Folder created successfully, show success message and close dialog
                            sap.m.MessageBox.success("Folder created successfully", {
                                onClose: function () {
                                    oDialog.close();
                                    location.reload();
                                    // Navigate back to detail2
                                    var oRouter = sap.ui.core.UIComponent.getRouterFor(oView);
                                    oRouter.navTo("detail2");
                                }
                            });
                        }
                    })
                    .catch(function (error) {
                        // Handle error
                        console.error('Error occurred during folder creation:', error);
                        sap.m.MessageBox.error("Failed to create folder");
                    });
            },

            // onSavecreate: function () {
            //     var oView = this.getView();
            //     var oDialog = oView.byId("create");

            //     // Get input values
            //     var sPolicyNo = oView.byId("folder").getValue();
            //     var sFileName = oView.byId("fileName").getValue();
            //     var oFileUploader = oView.byId("fileUploader");
            //     var oFile = oFileUploader.getFocusDomRef().files[0];

            //     if (!sPolicyNo || !sFileName || !oFile) {
            //         MessageBox.error("Policy number, file name, and file content are mandatory.");
            //         return;
            //     }

            //     // Read file content as base64
            //     var reader = new FileReader();
            //     reader.onload = function (e) {
            //         var sFileContent = e.target.result.split(',')[1]; // Get base64 content

            //         // Prepare data payload
            //         var oData = {
            //             POLICYNO: sPolicyNo,
            //             FILE_NAME: sFileName,
            //             FILE_CONTENT: sFileContent,
            //             MEDIA_TYPE: oFile.type
            //         };

            //         // Send data to backend
            //         fetch("/odata/v4/my/service/DMS_ATT", {
            //             method: "POST",
            //             headers: {
            //                 "Content-Type": "application/json"
            //             },
            //             body: JSON.stringify(oData)
            //         })
            //         .then(function (response) {
            //             if (!response.ok) {
            //                 throw new Error('Failed to create DMS_ATT record');
            //             }
            //             return response.json();
            //         })
            //         .then(function (data) {
            //             // Show success message and close dialog
            //             MessageBox.success("File uploaded and folder created successfully", {
            //                 onClose: function () {
            //                     oDialog.close();
            //                     location.reload();
            //                     // Navigate back to detail2
            //                     var oRouter = sap.ui.core.UIComponent.getRouterFor(oView);
            //                     oRouter.navTo("detail2");
            //                 }
            //             });
            //         })
            //         .catch(function (error) {
            //             // Handle error
            //             console.error('Error occurred during file upload:', error);
            //             MessageBox.error("Failed to upload file and create folder");
            //         });
            //     };

            //     reader.readAsDataURL(oFile); // Read file content
            // },

            closeFileUplaodFragment: function () {
                this._fileUploadFragment.destroy();
                this._fileUploadFragment = null;
                this._oFilesTobeuploaded = [];
                this.oItemsProcessor = [];
            },

            ondetailarrow: function (oEvent) {
                var sClaimId = oEvent.getSource().getBindingContext("MainModel").getProperty("CLAIM_ID");
                this.getClaimDetails(sClaimId);
                // Navigate to detail3 page
                this.getSplitAppObj().to(this.createId("detail3"));
            },



            getClaimDetails: function (sClaimId) {
                var that = this; // Preserve 'this' reference
                var sUrl = "./odata/v4/my/ClaimDetails?$filter=CLAIM_ID eq " + sClaimId;
                fetch(sUrl)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        // Display fetched details in detail3 page
                        // Create a new JSON model and set the data
                        var oLocalModel = new sap.ui.model.json.JSONModel();
                        that.getView().setModel(oLocalModel, "localModel");
                        oLocalModel.setProperty("/dataValue", data.value);
                    })
                    .catch(function (error) {
                        console.error('Error fetching claim details:', error);
                    });
            },

            formatDate: function (sDate) {
                if (!sDate) {
                    return "";
                }

                var oDate = new Date(sDate);
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                return oDateFormat.format(oDate);
            },

            isEditVisible: function (sStatus) {
                // Define the status that triggers the edit button visibility
                var allowedStatus = "Claim sent back to employee";

                // Return true if the status matches the allowed status, otherwise return false
                return sStatus === allowedStatus;
            },

            // onEdit: function () {
            //     this.getSplitAppObj().to(this.createId("detail"));
            // },

            onEdit: function () {
                // Navigate to the detail page
                this.getSplitAppObj().to(this.createId("detail"));

                // Get the local model
                var oLocalModel = this.getView().getModel("localModel");

                // Get the form data from the local model
                var oFormData = oLocalModel.getProperty("/dataValue/0");

                // Get the Claim ID label by its ID
                var oClaimIdLabel = this.byId("claimIdLabel");

                // var oClaimId = this.byId("claimId");

                // Update the text of the Claim ID label with the Claim ID value
                // oClaimIdLabel.setText(oFormData.CLAIM_ID);
                var claimId = oFormData.CLAIM_ID;

                // var Id = oFormData.ID

                // oClaimIdLabel.setText("Claim Id: " + claimId);

                oClaimIdLabel.setText(claimId);

                // oClaimId.setText(Id);
                // Make the Claim ID label visible
                oClaimIdLabel.setVisible(true);

                // oClaimId.setVisible(true);

                // Get the form elements by their IDs
                var oClaimTypeComboBox = this.byId("CT");
                var oTreatmentTypeComboBox = this.byId("TT");
                var oStartDatePicker = this.byId("startDatePicker1");
                var oEndDatePicker = this.byId("endDatePicker1");
                var oTreatmentForComboBox = this.byId("TF");
                var oTreatmentForOtherInput = this.byId("TreatmentForOther");
                var oPolicyNumberSelect = this.byId("PolicyNumber");
                var oSelectDependentsComboBox = this.byId("SD");
                // var oAvailabilityCheckBox = this.byId("Availability");
                // var oPrescriptionCheckBox = this.byId("prescription");
                // var oOriginalBillCheckBox = this.byId("originalbill");

                // Set the values of form fields from the retrieved data
                var startDate = new Date(oFormData.CLAIM_START_DATE);
                var endDate = new Date(oFormData.CLAIM_END_DATE);
                var billDate = new Date(oFormData.BILL_DATE);

                oClaimTypeComboBox.setSelectedKey(oFormData.CLAIM_TYPE);
                oTreatmentTypeComboBox.setSelectedKey(oFormData.TREATMENT_TYPE);
                oStartDatePicker.setValue(startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                oEndDatePicker.setValue(endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                oTreatmentForComboBox.setSelectedKey(oFormData.TREATMENT_FOR);
                oTreatmentForOtherInput.setValue(oFormData.TREATMENT_FOR_OTHER);
                oPolicyNumberSelect.setSelectedKey(oFormData.POLICY_NUMBER);
                oSelectDependentsComboBox.setSelectedKey(oFormData.SELECT_DEPENDENTS);
                // oAvailabilityCheckBox.setSelected(oFormData.AVAILABILITY);
                // oPrescriptionCheckBox.setSelected(oFormData.PRESCRIPTION);
                // oOriginalBillCheckBox.setSelected(oFormData.ORIGINAL_BILL);




                var oIconTabBar = this.byId("myIconTabBar");
                oIconTabBar.setSelectedKey("claimDetails");
            },
            formatNumericValue: function (sValue) {
                // Ensure sValue is a string
                var sNumericValue = String(sValue);

                // Remove any non-numeric characters using regular expression
                var sNumericOnlyValue = sNumericValue.replace(/\D/g, '');

                // Return the numeric-only value
                return sNumericOnlyValue;
            },
            // onAfterItemAdded: function (oEvent) {
            //     var item = oEvent.getParameter("item");
            //     this._createEntity(item)
            //         .then((id) => {
            //             console.log("Entity created successfully. ID:", id);
            //             this._uploadContent(item, id);
            //         })
            //         .catch((err) => {
            //             console.error("Error creating entity:", err);
            //             // Handle the error appropriately
            //         });
            // },

            onAfterItemAdded: function (oEvent) {
                var item = oEvent.getParameter("item");
                var policyNumber = this.byId("PolicyNumber").getSelectedKey(); // Get selected policy number
    
                if (!policyNumber) {
                    sap.m.MessageToast.show("Please select a policy number.");
                    return;
                }
    
                // Set the policy number to the item before triggering the CREATE event
                item.policyNumber = policyNumber;
    
                this._triggerCreateEvent(item);
            },
    
            onUploadCompleted: function (oEvent) {
                var oUploadSet = this.byId("uploadSet");
                oUploadSet.removeAllIncompleteItems();
                oUploadSet.getBinding("items").refresh();
            },
    
            onOpenPressed: function (oEvent) {
                // Implement the open pressed logic here
            },
            _triggerCreateEvent: function(item) {
                var policyNumber = this.byId("PolicyNumber").getSelectedKey();
            
                if (!policyNumber) {
                    console.error("No policy number selected");
                    sap.m.MessageToast.show("Please select a policy number.");
                    return;
                }
            
                var fileName = item.getFileName();
                var mediaType = item.getMediaType();
            
                if (!fileName || !mediaType) {
                    console.error("File name or media type is missing");
                    sap.m.MessageToast.show("File name or media type is missing.");
                    return;
                }
            
                var file = item.getFileObject();
            
                if (!file) {
                    console.error("File object is missing");
                    sap.m.MessageToast.show("File object is missing.");
                    return;
                }
            
                var reader = new FileReader();
                reader.onload = (e) => {
                    var fileContent = e.target.result.split(",")[1]; // Get base64 content
            
                    var data = {
                        "UPLOADED_DATE": new Date().toISOString(),
                        "UPLOADED_BY": "ASHWIN",
                        "FILE_URL": "MEDICAL CLAIM",
                        "MEDIA_TYPE": mediaType,
                        "FILE_NAME": fileName,
                        "FILE_NAME_DMS": `${fileName}_${new Date().toISOString()}`,
                        "BUSINESS_DOC_TYPE": "Test report",
                        "POLICYNO": policyNumber,
                        "FILE_CONTENT": fileContent
                    };
            
                    console.log("Data to be sent:", data);
            
                    var settings = {
                        url: "./odata/v4/my/DMS_ATT",
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify(data)
                    };
            
                    $.ajax(settings)
                        .done((results, textStatus, request) => {
                            console.log("File uploaded successfully:", results);
                            this._uploadContent(item, policyNumber); // Trigger the file content upload
                        })
                        .fail((xhr, textStatus, errorThrown) => {
                            console.error("Error uploading file:", xhr.status, xhr.statusText, xhr.responseText);
                            sap.m.MessageToast.show("Error uploading file: " + xhr.responseText);
                        });
                };
                reader.readAsDataURL(file);
            },            

            // _triggerCreateEvent: function(item) {
            //     var policyNumber = this.byId("PolicyNumber").getSelectedKey();
            
            //     if (!policyNumber) {
            //         console.error("No policy number selected");
            //         sap.m.MessageToast.show("Please select a policy number.");
            //         return;
            //     }
            
            //     var fileName = item.getFileName();
            //     var mediaType = item.getMediaType();
            
            //     if (!fileName || !mediaType) {
            //         console.error("File name or media type is missing");
            //         sap.m.MessageToast.show("File name or media type is missing.");
            //         return;
            //     }
            
            //     var file = item.getFileObject();
            
            //     if (!file) {
            //         console.error("File object is missing");
            //         sap.m.MessageToast.show("File object is missing.");
            //         return;
            //     }
            
            //     var reader = new FileReader();
            //     reader.onload = (e) => {
            //         var fileContent = e.target.result.split(",")[1]; // Get base64 content
            
            //         var data = {
            //             "UPLOADED_DATE": new Date().toISOString(),
            //             "UPLOADED_BY": "ASHWIN",
            //             "FILE_URL": "MEDICAL CLAIM",
            //             "MEDIA_TYPE": mediaType,
            //             "FILE_NAME": fileName,
            //             "FILE_NAME_DMS": `${fileName}_${new Date().toISOString()}`,
            //             "BUSINESS_DOC_TYPE": "Test report",
            //             "POLICYNO": policyNumber,
            //             "FILE_CONTENT": fileContent
            //         };
            
            //         console.log("Data to be sent:", data);
            
            //         var settings = {
            //             url: "./odata/v4/my/DMS_ATT",
            //             method: "POST",
            //             headers: {
            //                 "Content-Type": "application/json"
            //             },
            //             data: JSON.stringify(data)
            //         };
            
            //         $.ajax(settings)
            //             .done((results, textStatus, request) => {
            //                 console.log("File uploaded successfully:", results);
            //                 // Trigger any further upload processing if needed
            //             })
            //             .fail((xhr, textStatus, errorThrown) => {
            //                 console.error("Error uploading file:", xhr.status, xhr.statusText, xhr.responseText);
            //                 sap.m.MessageToast.show("Error uploading file: " + xhr.responseText);
            //             });
            //     };
            //     reader.readAsDataURL(file);
            // },            

            _uploadContent: function (item, policyNumber) {
                if (!policyNumber) {
                    console.error("No policy number selected for upload");
                    return;
                }
    
                var url = `/MEDICAL CLAIM/TEST REPORT/${policyNumber}`;
                item.setUploadUrl(url);
    
                var oUploadSet = this.byId("uploadSet");
                oUploadSet.setHttpRequestMethod("POST");
                oUploadSet.uploadItem(item);
            }
            
        });
    });