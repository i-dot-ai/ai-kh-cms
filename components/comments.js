// @ts-check

window["CMS"].registerEditorComponent({
    id: "comment",
    label: "Comment",
    fields: [{name: "comment", label: "Comment", widget: "text"}],
    pattern: /^<!--\s*([\s\S]*?)\s*-->$/m,
    fromBlock: (match) => {
        return {
            comment: match[1]
        }
    },
    toBlock: (data) => {
        return `<!-- ${data.comment} -->`;
    },
    toPreview: (data) => {
        return `<!-- ${data.comment} -->`;
    }
});