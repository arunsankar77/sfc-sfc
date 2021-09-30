({    
    handleSelectURL : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/CustomerServiceRecordLEX?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
    handleEshopProductSummary : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/EshopProductSummary?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
    ViewBills : function(component, event, helper) {
        var NoBill = $A.get("{!$Label.c.View_Bill_No_Bills_Generated}");
        var Date = "";
        if(component.get("v.accountRecord").Current_Bill_Date__c){
            Date = component.get("v.accountRecord").Current_Bill_Date__c.split('-');
            console.log("Date-"+Date[0]);
        }
        if(Date == "" || Date[0] == 2100){
            alert(NoBill);
        }
        else{
            var urlEvent = $A.get("e.force:navigateToURL");
            urlEvent.setParams({
                "url": "/apex/ViewBillSelector?Id="+ component.get("v.recordId")
            });
            urlEvent.fire();
        }},
    BillingAndPaymentHistory : function(component, event, helper) {
        //window.open(component.get("v.BillingAndPaymentHistory"),'_blank');
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/BillingAndPaymentHistory?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
	doInitHelper: function(component){
        var action = component.get("c.getDetails");
        action.setParams({ strId : component.get("v.recordId") });
        action.setCallback(this, function(Response) {
            var State = Response.getState();
            if (State === "SUCCESS") {
                var Resp = Response.getReturnValue();
                component.set("v.accountRecord", Resp.Account);
                component.set("v.userInfo", Resp.User);
                component.set("v.setting", Resp.setting);
                component.set("v.CstmLabelIsLead", $A.get("{!$Label.c.Is_Lead_Available}"));
                component.set("v.AccountEmail",Resp.Account.PersonEmail);
				component.set("v.appLaunch",Resp.URLs);
                component.set("v.eshopEnabledSetting",Resp.EshopEnabledSetting);
                if(Resp.Account.Billing_Source__c == 'CRIS' && Resp.Account.Conversion_Status__c == 'C'){
                    component.set("v.isConvertedAccount", true);
                    component.set("v.disableOrderButtons", true);
                }
				 if(Resp.Case.SSN_Verified_In_IVR__c =='Y'){
                  component.set("v.isVerifiedSSN",Resp.Case.Is_SSN_Verified__c);
                   console.log('v.isVerifiedSSN------->'+component.get("v.isVerifiedSSN"));
                }
				if(!Resp.BIWFSetting.Is_Enabled__c && Resp.Account.CHIA_Address_Count__c > 0){
                    component.set("v.disableOrderButtons", true);
                }
                if(Resp.Account.Data_TN__c){
                    component.set("v.TN",Resp.Account.Data_TN__c);
                }else if(Resp.Account.Billing_Source__c == 'CRIS' && Resp.Account.AccountNumber__c && Resp.Account.AccountNumber__c.length >= 10){
                    component.set("v.TN",Resp.Account.AccountNumber__c.substring(0, 10));
                }
                /*if(component.get("v.accountRecord").Primary_Service_Address__r.Fiber_estimated_order_available_date__c != undefined){
                     component.set("v.Construction_Date", component.get("v.accountRecord").Primary_Service_Address__r.Fiber_estimated_order_available_date__c);
                }*/
                if(Resp.Account.Primary_Service_Address__c != undefined){
                    component.set("v.IsLead", Resp.Account.Primary_Service_Address__r.Is_Lead_Available__c);
                    var cDate = component.get("v.accountRecord").Primary_Service_Address__r.Fiber_estimated_order_available_date__c;
                    if(cDate){
                    cDate = cDate.split('-');
                    if(cDate.length == 3)
                    	component.set("v.Construction_Date", cDate[1]+'-'+cDate[2]+'-'+cDate[0]);
                    else
                        component.set("v.Construction_Date", component.get("v.accountRecord").Primary_Service_Address__r.Fiber_estimated_order_available_date__c);
                    }
					component.set("v.Address_TerminalType", component.get("v.accountRecord").Primary_Service_Address__r.Terminal_Type__c);
                }
				if(Resp.isManualQuoteSendEnabled && Resp.isManualQuoteSendEnabled.Is_Send_Enabled__c ){	
                    component.set("v.showRCCButton",true);	
                }
				component.set("v.canSendSMS",Resp.isManualQuoteSendEnabled.Can_send_SMS__c );
				component.set("v.canSendTestEmails",Resp.isManualQuoteSendEnabled.Can_Send_Emails_In_test__c );
                console.log('setting-->'+component.get("v.setting").Is_NBA_Enabled__c);
                console.log('Profile-->'+component.get("v.userInfo").Profile.Name);
                console.log('Numbertes-->'+component.get("v.accountRecord").AccountNumber__c);
                console.log('IsLead-->'+component.get("v.IsLead"));
                console.log('Construction_Date-->'+component.get("v.Construction_Date"));
                console.log('CstmLabelIsLead-->'+component.get("v.CstmLabelIsLead"));
                var profileName = component.get("v.userInfo").Profile.Name;
                var setvalue = component.get("v.setting").Is_NBA_Enabled__c;
                console.log('setvalue-->'+setvalue);
                if( setvalue== true ){
                    component.set("v.isNBAEnabled",true);
                    console.log('NBA-->'+component.get("v.isNBAEnabled"));
                }
                if(Resp.IntegrationSimulation.CSC__c){
                    component.set("v.isCSEEnabled",true);
                }
				// CSICC-44748 - Call Method to check QBAT button visibility for new converted EShop accounts
                this.getQBATenabled(component);
            }
        });
        $A.enqueueAction(action);
    },
	doInitBOTHelper: function(component){
     var action = component.get("c.getBOTSimulationStatus");
            action.setParams({ SimulatorFieldName : "BOT_Access__c" });
            action.setCallback(this, function(Response) {
                var State = Response.getState();
                if (State === "SUCCESS") {
                    var BOTResp = Response.getReturnValue();
                    if(BOTResp == true){
                        console.log('BOTResp-->'+ BOTResp);
                        component.set("v.isBOTEnabled",BOTResp);
                        console.log('BOT-->'+component.get("v.isBOTEnabled"));
                    } else if(BOTResp == false){
                        component.set("v.isBOTEnabled",BOTResp);
                    }                    
                }
		 
            });
		$A.enqueueAction(action);
     },
    SelectPendingCharges : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/SelectPendingCharges?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
    EditBillingAddress : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/AccountEditBillingAddress?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
    QBAT : function(component, event, helper) {
        var url= "/apex/SSORedirectUtil?Id="+ component.get("v.recordId") +"&ssoApp=QBAT"
        window.open(url,'_blank');
    },
    BillingComparison : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/BillComparisonLEX?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    },
    PaymentOptions : function(component, event, helper) {
		var EnsembleId = component.get("v.userInfo").Ensemble_Id__c;
        if(EnsembleId=='' || EnsembleId==null){
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message":$A.get("{!$Label.c.ENSID_WarningMsg}")
           });
        toastEvent.fire();
        } else {
			/*var urlEvent = $A.get("e.force:navigateToURL");
			urlEvent.setParams({
				"url": "/apex/ManagePaymentOptions?Id="+ component.get("v.recordId")
			});
			urlEvent.fire();*/
			var evt = $A.get("e.force:navigateToComponent");
			evt.setParams({
			componentDef : "c:manualRestoreAura",
			componentAttributes: {
				recordId : component.get("v.recordId")
			}
		});
		evt.fire();
		} 
    },
    ReprintBill : function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/BillReprintFlowLaunch?account_id="+ component.get("v.recordId")
        });
        urlEvent.fire();
    } ,
    ShowAccountAdjustment : function(component, event, helper) {
            var workspaceAPI = component.find("workspace");
             workspaceAPI.getEnclosingTabId().then(function(enclosingTabId) {
                 workspaceAPI.openSubtab({
                     parentTabId: enclosingTabId,
                     pageReference: {
                         type: "standard__component",
                         attributes: {
                             componentName: "c__displayAdjustmentsAura"
                         },
                         state: {
                             c__recordId: component.get("v.recordId"),
                             c__accountnumber:component.get("v.accountRecord").AccountNumber__c
                         }
                     },
                     focus: true
                 }).then(function(subtabId) {
                     // the subtab has been created, use the Id to set the label
                     workspaceAPI.setTabLabel({
                         tabId: subtabId,
                         label: "Adjustments"
                     });
                     workspaceAPI.setTabIcon({
                        tabId: subtabId, 
                        icon: "standard:person_account"
                    });
                     //To maintain the browser label
                     workspaceAPI.focusTab({tabId : enclosingTabId});
                     workspaceAPI.focusTab({tabId : subtabId});                                
                 }).catch(function(error) {
                     console.log("error");
                 });
             });      
        /*commented for opening Adjustments as sub tab as part of CSICC-18683*/

		/*var EnsembleId = component.get("v.userInfo").Ensemble_Id__c;
        if(EnsembleId=='' || EnsembleId==null){
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message":$A.get("{!$Label.c.ENSID_WarningMsg}")
           });
        toastEvent.fire();
        } else {
        var Billing_Source = component.get("v.accountRecord").Billing_Source__c ;
        var userRole = "";
        if(component.get("v.userInfo").UserRoleId){
            userRole = component.get("v.userInfo").UserRole.Name;
        }
        var profileName = component.get("v.userInfo").Profile.Name;
        var isRoleCheckRequired = (profileName == 'System Administrator' || profileName == 'CAG Manager-Acquisition' || profileName == 'CAG User-Acquisition' || profileName == 'COR' || profileName == 'NOHD') == false;
        if(isRoleCheckRequired && (userRole.includes("Agent") || userRole.includes("Rep") || userRole.includes("Analyst"))){ 
            alert("You do not have permission to access this page."); 
        }else if(Billing_Source != "Ensemble"){
            alert("This feature available only for Ensemble accounts.");
        }else{
            if(!component.get("v.userInfo").ManagerId){
                alert("There is currently no manager identified for this user in Salesforce. Please have an OHD ticket created to update the user profile.");
            }else{
                var urlEvent = $A.get("e.force:navigateToURL");
                urlEvent.setParams({
                    "url": "/apex/AccountAdjustment?Id="+ component.get("v.recordId")
                });
                urlEvent.fire();  
            }                
        }         
		}*/
    },    //giri end
    handleUpdatetoTemporaryNoTreat : function(component) {
        var action = component.get("c.ChangeValuetoNT");
        action.setParams({ strId : component.get("v.recordId") });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "title": "Success!",
                    "message": "Treatment has been updated successfully.",
                    "type": "success"
                });
                toastEvent.fire();
                $A.get('e.force:refreshView').fire();
            }else if (state === "INCOMPLETE") {
                // do something.
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        var toastEvent = $A.get("e.force:showToast");
                        toastEvent.setParams({
                            "title": "Error!",
                            "message": errors[0].message,
                            "type": "error"
                        });
                        toastEvent.fire();
                    }
                } else {
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "title": "Error!",
                        "message": "Unknown error",
                        "type": "error"
                    });
                    toastEvent.fire();
                }
            }
        });
        $A.enqueueAction(action);
    },
    handleNewServiceAddress : function(component) {
        /*var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/ServiceAddressCreation?Id="+ component.get("v.recordId")
        });
        urlEvent.fire();*/
        // commented above code and below modification done to redirect to ServiceAddressCreation component instead of ServiceAddressCreation vf page
    	var evt = $A.get("e.force:navigateToComponent");
    	evt.setParams({
        componentDef : "c:ServiceAddressCreation",
        componentAttributes: {
            recordId : component.get("v.recordId")
        }
    });
    evt.fire();
    },
    handleKAL : function(component) {
        window.open('/apex/KALRedirect?Id='+ component.get("v.recordId"), '_blank');
    },
    handleChangeEmailPassword : function(component) {
       	if(!component.get("v.userInfo").CUID__c){
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message":'No CUID found on User record.'
            });
            toastEvent.fire();
        }else if(!component.get("v.TN")){
            var toastEvent = $A.get("e.force:showToast");
            var TnMessage = $A.get("{!$Label.c.TN_error_message}");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message": TnMessage
            });
            toastEvent.fire();
        }else{ 
            component.find('BOTChangeEmailPassword').inverseModal();
        } 
    },
    handleAddtoCampaign : function(component) {
        var evt = $A.get("e.force:navigateToComponent");
        evt.setParams({
            componentDef : "c:campaignMemberFlow",
            componentAttributes: {
            	recordId : component.get("v.recordId")
            }
        });
        evt.fire();
    },
    handlePrismanage : function(component) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "https://prismanage.corp.intranet/Security/Login"
        });
        urlEvent.fire();
    },
	 sendRMAHandler: function(component) {
		if(!component.get("v.userInfo").CUID__c){
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message":'No CUID found on User record.'
           });
        toastEvent.fire();
        }else if(!component.get("v.accountRecord").Data_TN__c && component.get("v.accountRecord").Billing_Source__c == 'Ensemble'){
            var toastEvent = $A.get("e.force:showToast");
            var TnMessage = $A.get("{!$Label.c.TN_error_message}");
            toastEvent.setParams({
                "mode": "sticky",
                "type": 'error',
                "title": "Error!",
                "message": TnMessage
           });
        toastEvent.fire();
		}else{ 
        component.set('v.isSendRMA',true);        
        component.find('sendRMA').inverseModal();
        }
    },
    handleRefresh : function(component) {
        $A.get('e.force:refreshView').fire();
    },
    DepositHist : function(component, event, helper) {
        var workspaceAPI = component.find("workspace");
         
         workspaceAPI.getEnclosingTabId().then(function(enclosingTabId) {
             workspaceAPI.openSubtab({
                 parentTabId: enclosingTabId,
                 pageReference: {
                     type: "standard__component",
                     attributes: {
                         componentName: "c__EdsDepositHistoryParent"
                     },
                     state: {
                         c__recordId: component.get("v.recordId")
                     }
                 },
                 focus: true
             }).then(function(subtabId) {
                 // the subtab has been created, use the Id to set the label
                 workspaceAPI.setTabLabel({
                     tabId: subtabId,
                     label: "Deposit History"
                 });
                 
                 // the subtab has been created, use the Id to set the icon
                 workspaceAPI.setTabIcon({
                     tabId: subtabId, 
                     icon: "standard:person_account",
                     iconAlt: "Deposit History"
                 });
                 
                 //To maintain the browser label
                 workspaceAPI.focusTab({tabId : enclosingTabId});
                 workspaceAPI.focusTab({tabId : subtabId});                                
             }).catch(function(error) {
                 console.log("error");
             });
         });
     },
	 
	 handleChangeCenturyLinkID : function(component) {
    	component.find('changecenturylinkid').inverseModal();
    },
    
    handleCenturyLinkIDPasswordReset : function(component) {
    	//Opening in Seperate Window
        var urlEvent = $A.get("e.force:navigateToURL");
        var qcUrl = $A.get("{!$Label.c.QuickConnectPasswordChangeUrl}");
        urlEvent.setParams({
          "url": qcUrl + component.get("v.accountRecord").AccountNumber__c
        });
        urlEvent.fire();
        
        //Opening in Subtab
        /*var workspaceAPI = component.find("workspace");
        workspaceAPI.getEnclosingTabId().then(function(enclosingTabId) {
        	workspaceAPI.openSubtab({
                 parentTabId: enclosingTabId,
                 url: qcUrl + component.get("v.accountRecord").AccountNumber__c,
                 focus: true
            })
        })
        .catch(function(error) {
            console.log(error);
        });*/
    },
	
	handleStatementSummary : function(component){
         var workspaceAPI = component.find("workspace");
         
         workspaceAPI.getEnclosingTabId().then(function(enclosingTabId) {
             workspaceAPI.openSubtab({
                 parentTabId: enclosingTabId,
                 pageReference: {
                     type: "standard__component",
                     attributes: {
                         componentName: "c__statementSummaryParent"
                     },
                     state: {
                         c__recordId: component.get("v.recordId")
                     }
                 },
                 focus: true
             }).then(function(subtabId) {
                 // the subtab has been created, use the Id to set the label
                 workspaceAPI.setTabLabel({
                     tabId: subtabId,
                     label: "Statement Summary"
                 });
                 
                 // the subtab has been created, use the Id to set the icon
                 workspaceAPI.setTabIcon({
                     tabId: subtabId, 
                     icon: "standard:report",
                     iconAlt: "Statement Summary"
                 });
                 
                 //To maintain the browser label
                 workspaceAPI.focusTab({tabId : enclosingTabId});
                 workspaceAPI.focusTab({tabId : subtabId});                                
             }).catch(function(error) {
                 console.log("error");
             });
         });
    },

    /** Action function to fetch the internal chat button menu Names and Agent availability status*/
    doInitGetInternalTeamWrapperHelper : function(component){
        var action = component.get("c.fetchInternalChatTeamWrapper");

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set('v.internalChatWrapperList', response.getReturnValue());
                this.doInitCheckChatTeamAvailability(component);
            }
        });
        $A.enqueueAction(action);
    },

    /** Function to receive the message from 'InternalLiveAgent' VF page and update the 'internalChatWrapperList' attribute with agent availability status */
    doInitCheckChatTeamAvailability: function(component){
        let vfOrigin;
        let chatButtonEventRegex = /^{"type":"ChatButtonEvent",.*?}$/;
        let chatButtonEventHandlerFn = $A.getCallback(function(event) {
            if(!vfOrigin) {
                let vfHost = component.get("v.vfHost");
                vfOrigin = vfHost ? "https://" + vfHost : undefined;
            } 
            let eventOrigin = event.origin ? event.origin.toLowerCase() : undefined;
            if (!vfOrigin || eventOrigin !== vfOrigin || !event.data || (typeof event.data) != 'string') {
                // Not the expected origin or no event data: Reject the message!
                return;
            }
            
            if(chatButtonEventRegex.test(event.data)) {
                let chatWrapperList = component.get("v.internalChatWrapperList");
            	let eventData = JSON.parse(event.data);
                if(chatWrapperList !== undefined){
                    for(var i = 0; i < chatWrapperList.length; i++){
                        if(chatWrapperList[i].chatTeamDeveloperName === eventData.buttonName){
                            chatWrapperList[i].isOffline = eventData.isOffline;
                            break;
                        }
                    }
                }
                component.set("v.internalChatWrapperList",chatWrapperList);
            }
        });
        window.addEventListener("message", chatButtonEventHandlerFn, false);
        let removeChatButtonHandlerFn = function() {
            window.removeEventListener("message", chatButtonEventHandlerFn);
        };
        component.set("v.removeChatButtonHandlerFn", removeChatButtonHandlerFn);
    },

    /** Function to fetch the chat button name and Id. Stores the details in internalChatButtonNameIdMap attribute */
    doInitGetChatButtonNameIDHelper: function(component){
        var action = component.get("c.fetchInternalChatTeamIdMap");

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set('v.internalChatButtonNameIdMap', response.getReturnValue());
            }
        });
        $A.enqueueAction(action);
    },
    /** Function to classic visualforce page url - vfHost  */
    getVisualforceHost: function(component){
        var action = component.get("c.getVisualforceHost");

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set('v.vfHost', response.getReturnValue().toLowerCase());
            }
        });
        $A.enqueueAction(action);
    },

    /** Function to post message to VF page with button Id and start the chat */
    startChatHelper: function(component,selectedChatDevName){
        var vfOrigin = "https://" + component.get("v.vfHost");
        var vfWindow = component.find("vfFrame").getElement().contentWindow;
        var buttonId = component.get("v.internalChatButtonNameIdMap")[selectedChatDevName];
        buttonId = (buttonId.length > 15) ? buttonId.substring(0,15) : buttonId;
        let startChatMessage = {"type":"StartChatEvent", "buttonId": buttonId};
        vfWindow.postMessage(startChatMessage, vfOrigin);
    },
	
    handleTroubleshoot: function(component, event, handler){
        component.set("v.CSC_URL", component.get("v.appLaunch").CSC__c);
        component.find('CSCTroubleshoot').inverseModal();
    },
	 Reverifycustomer:function(component)
    {
        console.log('here');
        component.find('ReverifyCustomer').inverseModal();
    },
	handleDocsForms : function(component, event, handler){
    	var urlEvent = $A.get("e.force:navigateToURL");
        var urlname = component.get("v.appLaunch").DOCS_Forms__c;
        console.log('DOCS URL '+urlname );
        urlEvent.setParams({
          "url": urlname
        });
        urlEvent.fire();
    },
    // CSICC-44748 - Add function to check QBAT button visibility for converted BAN accounts
    getQBATenabled: function(component){
        var date1 = new Date();
        var accountRec = component.get("v.accountRecord");
        console.log('acc rec - '+ accountRec);
        if(accountRec != undefined && accountRec.Converted_Date__c != undefined){
            var date2 = new Date(component.get("v.accountRecord").Converted_Date__c);
            var conversiondays = $A.get("{!$Label.c.C2E_Purge_CRIS_Account_Days}");
            var differenceInTime = date1.getTime() - date2.getTime();
            //var differenceInTime = 
            var differenceInDays = differenceInTime / (1000 * 3600 * 24);
            console.log('differenceInDays' + differenceInDays);
             console.log('conversiondays' + conversiondays);
            if(differenceInDays > conversiondays){
                component.set("v.isQBATEnabled", false);
            }
            else{
                component.set("v.isQBATEnabled", true);
            }
            
             console.log('isQBATEnabled -' + component.get("v.isQBATEnabled"));
        }
	}
})