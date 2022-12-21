
// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import "./lib/Base64.sol";
import "./lib/Utils.sol";

/// @notice Modern, minimalist, and gas efficient ERC-721 implementation.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC721.sol)
contract AnonTakenameRegistry {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Transfer(address indexed from, address indexed to, uint256 indexed id);

    event Approval(address indexed owner, address indexed spender, uint256 indexed id);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /*//////////////////////////////////////////////////////////////
                         METADATA STORAGE/LOGIC
    //////////////////////////////////////////////////////////////*/

    string public name;

    string public symbol;

    /*//////////////////////////////////////////////////////////////
                      ERC721 BALANCE/OWNER STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => address) internal _ownerOf;

    mapping(address => uint256) internal _balanceOf;

    function ownerOf(uint256 id) public view virtual returns (address owner) {
        require((owner = _ownerOf[id]) != address(0), "NOT_MINTED");
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), "ZERO_ADDRESS");

        return _balanceOf[owner];
    }

    /*//////////////////////////////////////////////////////////////
                         ERC721 APPROVAL STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => address) public getApproved;

    mapping(address => mapping(address => bool)) public isApprovedForAll;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              ERC721 LOGIC
    //////////////////////////////////////////////////////////////*/

    function approve(address spender, uint256 id) public virtual {
        address owner = _ownerOf[id];

        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "NOT_AUTHORIZED");

        getApproved[id] = spender;

        emit Approval(owner, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        isApprovedForAll[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        require(from == _ownerOf[id], "WRONG_FROM");

        require(to != address(0), "INVALID_RECIPIENT");

        require(
            msg.sender == from || isApprovedForAll[from][msg.sender] || msg.sender == getApproved[id],
            "NOT_AUTHORIZED"
        );

        // Underflow of the sender's balance is impossible because we check for
        // ownership above and the recipient's balance can't realistically overflow.
        unchecked {
            _balanceOf[from]--;

            _balanceOf[to]++;
        }

        _ownerOf[id] = to;

        delete getApproved[id];

        emit Transfer(from, to, id);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        transferFrom(from, to, id);

        require(
            to.code.length == 0 ||
                ERC721TokenReceiver(to).onERC721Received(msg.sender, from, id, "") ==
                ERC721TokenReceiver.onERC721Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes calldata data
    ) public virtual {
        transferFrom(from, to, id);

        require(
            to.code.length == 0 ||
                ERC721TokenReceiver(to).onERC721Received(msg.sender, from, id, data) ==
                ERC721TokenReceiver.onERC721Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    /*//////////////////////////////////////////////////////////////
                              ERC165 LOGIC
    //////////////////////////////////////////////////////////////*/

    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f; // ERC165 Interface ID for ERC721Metadata
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL MINT/BURN LOGIC
    //////////////////////////////////////////////////////////////*/

    function _mint(address to, uint256 id) internal virtual {
        require(to != address(0), "INVALID_RECIPIENT");

        require(_ownerOf[id] == address(0), "ALREADY_MINTED");

        // Counter overflow is incredibly unrealistic.
        unchecked {
            _balanceOf[to]++;
        }

        _ownerOf[id] = to;

        emit Transfer(address(0), to, id);
    }

    function _burn(uint256 id) internal virtual {
        address owner = _ownerOf[id];

        require(owner != address(0), "NOT_MINTED");

        // Ownership check above ensures no underflow.
        unchecked {
            _balanceOf[owner]--;
        }

        delete _ownerOf[id];

        delete getApproved[id];

        emit Transfer(owner, address(0), id);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL SAFE MINT LOGIC
    //////////////////////////////////////////////////////////////*/

    function _safeMint(address to, uint256 id) internal virtual {
        _mint(to, id);

        require(
            to.code.length == 0 ||
                ERC721TokenReceiver(to).onERC721Received(msg.sender, address(0), id, "") ==
                ERC721TokenReceiver.onERC721Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function _safeMint(
        address to,
        uint256 id,
        bytes memory data
    ) internal virtual {
        _mint(to, id);

        require(
            to.code.length == 0 ||
                ERC721TokenReceiver(to).onERC721Received(msg.sender, address(0), id, data) ==
                ERC721TokenReceiver.onERC721Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }






    

    using Utils for uint;
    using StringUtils for string;

    event NameRegistered(address indexed user, string name);
    event OperatorChanged(address indexed operator);

    // the operator is the only address that can register names.
    // the point of the name registry is to be used by anons in order to secure their account.
    // we're not selling names just yet.
    
    // TODO change this to public
    address operator;

    struct AnonTakename {
        string name;
    }
    mapping(uint256 => AnonTakename) takenames;
    mapping(string => uint256) takenameToId;
    uint256 public totalSupply;

    constructor() {
        name = "anon takers v1";
        symbol = "ANON+TAKER";
        operator = msg.sender;
        _registerName("nakamofo");
    }

    function getTakenameForId(uint id) public view returns (string memory) {
        return takenames[id].name;
    }

    // function getTakenameForAddress(address addr) public view returns (string memory) {
    //     return takenames[ownerOf(addr)].name;
    // }

    function setOperator(address _operator) public {
        require(msg.sender == operator, "only operator");
        operator = _operator;
        emit OperatorChanged(_operator);
    }

    function registerName(string memory name) public returns (uint256) {
        require(msg.sender == operator, "only operator");
        require(takenameToId[name] == 0, "name already registered");
        return _registerName(name);
    }

    function _registerName(string memory name) internal returns (uint256) {
        require(bytes(name).length > 0, "name must be non-empty");
        require(bytes(name).length <= 32, "name must be less than 32 characters");

        uint256 id = totalSupply++;

        takenameToId[name] = id;
        AnonTakename memory takename = AnonTakename(name);
        takenames[id] = takename;

        _safeMint(msg.sender, id);

        // Mint them the name they want.
        emit NameRegistered(msg.sender, name);

        return id;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        // Load the name from the mapping.
        AnonTakename memory takename = takenames[tokenId];

        string memory output = tokenURIImageJson(tokenId);
        // NOTE: the newline is encoded in JSON, not in Solidity as \newline.
        string memory description = takename.name.concat(".anon").concat("\\n").concat(unicode"take is [xx] · https://twitter.com/takeisxx");
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "take anon #', Utils.toString(tokenId), '", "description": "', description,'", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'))));
        output = string(abi.encodePacked('data:application/json;base64,', json));

        return output;
    }

    function tokenURIImageJson(uint256 tokenId) public view returns (string memory) {
        AnonTakename memory takename = takenames[tokenId];

        string[17] memory parts;
        parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 300 300"><style>.base { fill: white; font-family: sans-serif; font-size: 18px; }</style><rect width="100%" height="100%" fill="#E31C79" />';


        // each line is max 20 chars
        // iterate over the chars of the string and start a new line every 20 chars
        parts[1] = '<text x="10" y="20" class="base">';
        uint y = 20;
        for (uint256 i = 0; i < bytes(takename.name).length; i++) {
            if (i % 20 == 0 && i != 0) {
                string memory a = '</text><text x="10" y="';
                parts[1] = parts[1].concat(a.concat(Utils.toString(y)).concat('" class="base">'));
            }
            bytes1 c = bytes(takename.name)[i];
            parts[1] = parts[1].concat(string(abi.encodePacked(c)));
        }
        parts[1] = parts[1].concat('.anon</text>');
        parts[2] = '</svg>';

        string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8]));
        output = string(abi.encodePacked(output, parts[9], parts[10], parts[11], parts[12], parts[13], parts[14], parts[15], parts[16]));
        return output;
    }
}


/// @notice A generic interface for a contract which properly accepts ERC721 tokens.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC721.sol)
abstract contract ERC721TokenReceiver {
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external virtual returns (bytes4) {
        return ERC721TokenReceiver.onERC721Received.selector;
    }
}

