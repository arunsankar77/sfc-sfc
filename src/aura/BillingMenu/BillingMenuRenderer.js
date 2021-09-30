({
	unrender: function (component) {
    	this.superUnrender();
       
    	let removeChatButtonHandlerFn = component.get("v.removeChatButtonHandlerFn");
        if(removeChatButtonHandlerFn) {
            removeChatButtonHandlerFn();
        }
	}
})