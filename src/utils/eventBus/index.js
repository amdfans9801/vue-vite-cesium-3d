import Mitt from "mitt";

const eventBus = new Mitt();

eventBus.$on = eventBus.on;
eventBus.$off = eventBus.off;
eventBus.$emit = eventBus.emit;

export default eventBus;
