({
    handleSelect: function(component, event, helper) {
        var menuValue = event.getParam("value");
        switch(menuValue) {
            case "ProductSummary": helper.handleSelectURL(component); break;
            case "EshopProductSummary": helper.handleEshopProductSummary(component); break;    
            case "CSR": helper.handleSelectURL(component); break;
            case "ViewBills": helper.ViewBills(component); break;
            case "Billing": helper.BillingAndPaymentHistory(component); break;
            case "Charges": helper.SelectPendingCharges(component); break;
            case "EditBilling": helper.EditBillingAddress(component); break;
            case "Order": helper.Order(component); break;
            case "Order_ESHOP": helper.OrderESHOP(component); break;
            case "QBAT": helper.QBAT(component); break;
	    //case "Offers": helper.Offers(component); break; 
            case "BillComparison": helper.BillingComparison(component); break; //giri
            case "PaymentOptions": helper.PaymentOptions(component); break;  //LCC-772
            case "BillReprint": helper.ReprintBill(component); break; //giri
            case "ShowAccountAdjustment": helper.ShowAccountAdjustment(component); break;   //giri  
            case "UpdatetoTemporaryNoTreat": helper.handleUpdatetoTemporaryNoTreat(component); break;
            case "NewServiceAddress": helper.handleNewServiceAddress(component); break;
            case "KAL": helper.handleKAL(component); break;
            case "ChangeEmailPassword": helper.handleChangeEmailPassword(component); break;
            case "AddtoCampaign": helper.handleAddtoCampaign(component); break;
            case "Refresh": helper.handleRefresh(component); break;
            case "Prismanage": helper.handlePrismanage(component); break;
            case "DepositHist": helper.DepositHist(component); break;
			case "sendRMA": helper.sendRMAHandler(component); break;
			case "ChangeCenturyLinkID": helper.handleChangeCenturyLinkID(component); break;
            case "CenturyLinkIDPasswordReset": helper.handleCenturyLinkIDPasswordReset(component); break;
			case "statementSummary":helper.handleStatementSummary(component); break;
			case "docsForms" : helper.handleDocsForms(component); break;
			case "reverifyCustomer" :helper.Reverifycustomer(component); break;
            case "LaunchCSCtroubleshoot" :  helper.handleTroubleshoot(component, event, helper); break;
		}
    },
    doInit : function(component, event, helper) {
        helper.doInitHelper(component);
		helper.doInitBOTHelper(component);    
        helper.doInitGetInternalTeamWrapperHelper(component);
        helper.doInitGetChatButtonNameIDHelper(component);
        helper.getVisualforceHost(component);  
    },
    handleStartChat: function(component, event, helper){
        var selectedChatDevName = event.getParam("value");
        helper.startChatHelper(component,selectedChatDevName);        
    },
    handlePubsubReady: function(component, event, helper) {
        var pubsub = component.find("pubsub");
		const savedHelper = helper;
        var callback = $A.getCallback(function() {
            savedHelper.doInitHelper(component);
        });
        pubsub.registerListener("loopQualIsFinished", callback);
    },
    handleDestroy: function(component) {
        var pubsub = component.find("pubsub");
        pubsub.unregisterAllListeners();
    },
        Order : function(component, event, helper) {
         var url= "/apex/OrderAppRedirect?Id="+ component.get("v.recordId")
         window.open(url,'_blank');
    },
	sendRCC:function(component, event, helper) {	
        component.set("v.showRCCsend", true);	
    },	
    closeModal:function(component, event, helper) {	
        component.set("v.showRCCsend", false);	
    },
	no : function(component, event, helper) {
        component.set("v.IsLead", true);
    },
    yes : function(component, event, helper) {
        var action = component.get("c.createLeadForFiber");
        action.setParams({ svcAddId: component.get("v.accountRecord").Primary_Service_Address__c });
        action.setCallback(this, function(Response) {
            var State = Response.getState();
            if (State === "SUCCESS") {
                component.set("v.IsLead", true);
            }
        });
        $A.enqueueAction(action);
    },
    Order_ESHOP : function(component, event, helper) {
        var isNewWindow = component.get("v.eshopEnabledSetting").Launch_in_New_Window__c;
        var isNewTab = component.get("v.eshopEnabledSetting").Launch_in_New_Tab__c;
        var url = '/apex/OrderAppRedirect?Id='+ component.get('v.recordId') +'&btnClicked=ESHOP';
        if(isNewWindow){
            window.open(url,'_blank','status=1,toolbar=0');
        }else if(isNewTab){
            window.open(url,'_blank');
        }else{
            var urlEvent = $A.get("e.force:navigateToURL");
            urlEvent.setParams({
                "url": url
            });
            urlEvent.fire();
        }
    
    },
     Offers : function(component, event, helper) {
                    var accstatus = component.get("v.accountRecord").Account_Status__c;
                    console.log('accstatus-->'+accstatus);
        			var haspendingorders = component.get("v.accountRecord").HasPendingEshopOrders__c;
        			console.log('Pending order-->'+haspendingorders);
         			
         			const labelFullString = $A.get("{!$Label.c.NbaLaunchDisabledStatuses}");
         			//stringList = $A.get("{!$Label.c.NbaLaunchDisabledStatuses}");
                     if(labelFullString){
                        var stringList = labelFullString.split(",");
                        if(accstatus && !stringList.includes(accstatus)){
                        //if(accstatus && accstatus!= 'Disconnect : DISC' && accstatus!='' && accstatus!= 'Canceled' && accstatus!= 'Final' && !accstatus.includes("Write") && accstatus!= 'OTN' && !accstatus.includes("Vacation") && accstatus!= 'Tentative' && accstatus!= 'Closed' && accstatus!= 'Suspended'){  
                        console.log('if');
                        if(haspendingorders != false){
                        	console.log('Else');
                        	alert('It appears there may be a pending order on this account given the status of one of its products. Please follow BAU process to determine which offers work best for the customer’s need');     
                        }else{
							// Inserting Notes upon clicking on Offers button - start
							var action = component.get("c.createNotesOnOfferClick");
							action.setParams({ accid : component.get("v.recordId") });
							action.setCallback(this, function(response) {
								var state = response.getState();
								if (state === "SUCCESS") {
                                    var pubsub = component.find("pubsub");
                                    console.log(response.getReturnValue());
                                    pubsub.fireEvent("offerButtonClicked", response.getReturnValue());
                                    console.log('@@@@ task created successfully' );    
                                    var urlEvent = $A.get("e.force:navigateToURL");
                                    urlEvent.setParams({
                                        "url": "/apex/NBAWindow?Id="+ component.get("v.recordId") + "&UniqueId=" +response.getReturnValue()
                                    });
                                    urlEvent.fire();
								}
								
							});
							$A.enqueueAction(action);
							// Inserting Notes upon clicking on Offers button - end
                        
                        }
                    }else { 
                        console.log('Else');
                        alert('Account is inactive. Please follow BAU process to determine the customer’s best solution.'); 
                    } 
                     }
         			
                },
				
    Troubleshoot : function(component, event, helper) {
        helper.handleTroubleshoot(component, event, helper);
    },
	Conport : function(component, event, helper) {
		var url= component.get("v.appLaunch").Conport__c + component.get("v.recordId");
        window.open(url,'_blank');
    },
	
	afterRender: function (component, helper) {
        this.superAfterRender();
    }
})