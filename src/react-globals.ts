var ReactNS = __toESM(require_react());
var ReactDOMClient = __toESM(require_client());
var ReactDOMMain = __toESM(require_react_dom());
window.React = ReactNS;
window.ReactDOM = { ...ReactDOMMain, ...ReactDOMClient };

