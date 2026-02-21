const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock simple Component
const HighlightedText = ({ text, highlight, truncate = false }) => {
    if (!text || typeof text !== 'string') return null;
    
    if (!highlight && !truncate) return React.createElement('span', null, text);
    if (!highlight && truncate) {
        const maxLength = 200;
        if (text.length <= maxLength) return React.createElement('span', null, text);
        return React.createElement('span', null, text.slice(0, maxLength) + '...');
    }

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const createFlexiblePattern = (input) => {
        return input.split('').map(char => escapeRegExp(char)).join('');
    };

    try {
        const pattern = createFlexiblePattern(highlight);
        const regex = new RegExp(`(${pattern})`, 'gi');
        let displayText = text;
        const parts = displayText.split(regex);

        return React.createElement('span', null, 
            parts.map((p, i) => i % 2 === 1 ? React.createElement('span', {key:i}, p) : p)
        );
    } catch (e) {
        return React.createElement('span', null, text);
    }
};

try {
    console.log(ReactDOMServer.renderToString(React.createElement(HighlightedText, { text: "test", highlight: "" })));
    console.log(ReactDOMServer.renderToString(React.createElement(HighlightedText, { text: "test", highlight: null })));
    console.log(ReactDOMServer.renderToString(React.createElement(HighlightedText, { text: "test", highlight: undefined })));
    console.log(ReactDOMServer.renderToString(React.createElement(HighlightedText, { text: "", highlight: "test" })));
    console.log(ReactDOMServer.renderToString(React.createElement(HighlightedText, { text: null, highlight: "test" })));
    console.log("All renders passed");
} catch(e) {
    console.error("Render failed", e);
}
