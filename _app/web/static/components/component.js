class DummyComponent {
    constructor(innerHtml = "") {
        this.innerHtml = innerHtml;     
    }

    render() {
        return this.renderHtml()
    }

    renderHtml() {
        return this.innerHtml;
    }
}

export default DummyComponent;