({
	EPWFCall : function(component) {
		var action = component.get("c.invokeEPWFPaymentservice");
        action.setParams({
            accId : component.get("v.recordId")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var tempAction = component.get("c.processEpwfPaymentResp");
                console.log('response--'+response.getReturnValue());
                var responseValue = response.getReturnValue();
                tempAction.setParams({
                    accountId : component.get("v.recordId"),
                    JSONhttpResponse : JSON.stringify(response.getReturnValue())
                    //JSONhttpResponse : JSON.parse(responseValue)
                });
                
                tempAction.setCallback(this, function(tempResponse) {
                    var tempState = tempResponse.getState();
                    if (tempState === "SUCCESS") {
                        console.log('SUCCESS'); 
                    }
                });
                $A.enqueueAction(tempAction);
            }
        });
        $A.enqueueAction(action);
	}
})