export function createCorrectionTestContainer() {
  const document = {
    createElement() {
      let html = '';
      return {
        ownerDocument: document,
        style: {},
        children: [],
        parentNode: null,
        attributes: new Map(),
        listeners: new Map(),
        get isConnected() { return this === container || Boolean(this.parentNode?.isConnected); },
        get innerHTML() { return html; },
        set innerHTML(value) {
          this.replaceChildren();
          html = value;
        },
        setAttribute(name, value) { this.attributes.set(name, value); },
        addEventListener(name, listener) { this.listeners.set(name, listener); },
        append(...nodes) {
          for (const node of nodes) {
            node.remove();
            node.parentNode = this;
            this.children.push(node);
          }
        },
        replaceChildren(...nodes) {
          for (const child of this.children) child.parentNode = null;
          this.children.length = 0;
          html = '';
          this.append(...nodes);
        },
        remove() {
          if (!this.parentNode) return;
          const siblings = this.parentNode.children;
          siblings.splice(siblings.indexOf(this), 1);
          this.parentNode = null;
        }
      };
    }
  };
  const container = document.createElement();
  return container;
}
