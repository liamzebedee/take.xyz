contract Upgradeable {
    address public resolver;

    constructor(address _resolver) {
        resolver = _resolver;
    }

    function getTarget(string memory name) internal returns (address) {
        Registry registry = Registry(resolver);
        return registry.targets(name);
    }

    function injectBatch(string memory name) internal returns (address) {
        Registry registry = Registry(resolver);
        return registry.targets(name);
    }
}