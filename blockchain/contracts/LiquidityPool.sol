// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LiquidityPool is ERC20, ReentrancyGuard {
  IERC20 public immutable token;

  event Mint(address indexed sender, uint amount0, uint amount1);
  event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
  event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to);
  event Sync(uint112 reserve0, uint112 reserve1);

  uint public reserve0; // ETH reserve
  uint public reserve1; // NEST reserve
  uint private unlocked = 1;
    
  // 0.3% fee = 0.003
  uint private constant FEE_NUMERATOR = 997;
  uint private constant FEE_DENOMINATOR = 1000;

  modifier lock() {
    require(unlocked == 1, 'LOCKED');
    unlocked = 0;
    _;
    unlocked = 1;
  }

  constructor(address _token) ERC20("ETH-NEST LP Token", "LPN") {
    token = IERC20(_token);
  }

  receive() external payable {} // Allow contract to receive ETH

  function getReserves() public view returns (uint _reserve0, uint _reserve1) {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    return (_reserve0, _reserve1);
  }

  function _update(uint balance0, uint balance1) private {
    reserve0 = balance0;
    reserve1 = balance1;
    emit Sync(uint112(balance0), uint112(balance1));
  }

  function addLiquidity(
    uint amountTokenDesired,    // Needed NEST amount
    uint amountTokenMin,        // Min NEST allowed
    uint amountETHMin,         // Min ETH allowed
    address to,                // LP tokens receiver address
    uint deadline              // Max execution date
  ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        require(deadline >= block.timestamp, 'EXPIRED');
    
    (uint reserveETH, uint reserveToken) = getReserves();
    
    if (reserveETH == 0 && reserveToken == 0) {
        amountToken = amountTokenDesired;
        amountETH = msg.value;
    } else {
        amountETH = quote(amountTokenDesired, reserveToken, reserveETH);
        require(msg.value >= amountETH, "INSUFFICIENT_ETH");
        amountToken = amountTokenDesired;
    }
    
    require(amountETH >= amountETHMin, "INSUFFICIENT_ETH_AMOUNT");
    require(amountToken >= amountTokenMin, "INSUFFICIENT_TOKEN_AMOUNT");
    
    // Transfert NEST to contract
    require(token.transferFrom(msg.sender, address(this), amountToken), "TRANSFER_FAILED");
    
    // Mint LP tokens
    liquidity = _mintLiquidity(to);
    
    // Refund excess ETH
    if (msg.value > amountETH) {
        payable(msg.sender).transfer(msg.value - amountETH);
    }
    
    return (amountToken, amountETH, liquidity);
  }

  function quote(uint amountA, uint reserveA, uint reserveB) public pure returns (uint amountB) {
    require(amountA > 0, 'INSUFFICIENT_AMOUNT');
    require(reserveA > 0 && reserveB > 0, 'INSUFFICIENT_LIQUIDITY');
    
    // formule: amountB = (amountA * reserveB) / reserveA
    return (amountA * reserveB) / reserveA; // Return amountB theoric price
  }

  function _mintLiquidity(address to) private returns (uint liquidity) {
    (uint _reserve0, uint _reserve1) = getReserves();
    
    uint balance0 = address(this).balance;
    uint amount0 = balance0 - _reserve0;
    
    // Get token balance and calculate amount1
    uint balance1 = token.balanceOf(address(this));
    require(balance1 > _reserve1, "INSUFFICIENT_TOKEN_AMOUNT");
    uint amount1 = balance1 - _reserve1;
    
    require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_INPUT_AMOUNT");

    uint _totalSupply = totalSupply();
    if (_totalSupply == 0) {
        liquidity = Math.sqrt(amount0 * amount1);
    } else {
        liquidity = Math.min(
            (amount0 * _totalSupply) / _reserve0,
            (amount1 * _totalSupply) / _reserve1
        );
    }
    require(liquidity > 0, 'INSUFFICIENT_LIQUIDITY_MINTED');
    
    _mint(to, liquidity);
    _update(balance0, balance1);
    emit Mint(msg.sender, amount0, amount1);
  }

  function swapExactETHForTokens(uint amountOutMin, address to) external payable lock nonReentrant {
    require(msg.value > 0, 'INSUFFICIENT_INPUT_AMOUNT');
    
    uint amountOut = getAmountOut(msg.value, reserve0, reserve1);
    require(amountOut >= amountOutMin, 'INSUFFICIENT_OUTPUT_AMOUNT');

    token.transfer(to, amountOut);
    
    _update(address(this).balance, token.balanceOf(address(this)));
    emit Swap(msg.sender, msg.value, 0, 0, amountOut, to);
  }

  function swapExactTokensForETH(uint amountIn, uint amountOutMin, address to) external lock nonReentrant {
    require(amountIn > 0, 'INSUFFICIENT_INPUT_AMOUNT');
    
    uint amountOut = getAmountOut(amountIn, reserve1, reserve0);
    require(amountOut >= amountOutMin, 'INSUFFICIENT_OUTPUT_AMOUNT');

    token.transferFrom(msg.sender, address(this), amountIn);
    (bool success,) = to.call{value: amountOut}("");
    require(success, 'ETH_TRANSFER_FAILED');

    _update(address(this).balance, token.balanceOf(address(this)));
    emit Swap(msg.sender, 0, amountIn, amountOut, 0, to);
  }

  // Return real price during swap (including slippage + fees)
  function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
    require(amountIn > 0, 'INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'INSUFFICIENT_LIQUIDITY');
    
    uint amountInWithFee = amountIn * FEE_NUMERATOR;
    uint numerator = amountInWithFee * reserveOut;
    uint denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
    amountOut = numerator / denominator;
  }

  function _burnLiquidity(address to) internal returns (uint amount0, uint amount1) {
    uint liquidity = balanceOf(address(this));
    uint _totalSupply = totalSupply();
    amount0 = (liquidity * reserve0) / _totalSupply;
    amount1 = (liquidity * reserve1) / _totalSupply;
    require(amount0 > 0 && amount1 > 0, 'INSUFFICIENT_LIQUIDITY_BURNED');
    
    _burn(address(this), liquidity);
    
    (bool success,) = to.call{value: amount0}("");
    require(success, 'ETH_TRANSFER_FAILED');
    token.transfer(to, amount1);

    _update(address(this).balance, token.balanceOf(address(this)));
    emit Burn(msg.sender, amount0, amount1, to);
    
    return (amount0, amount1);
  }

  function burn(address to) external nonReentrant returns (uint amount0, uint amount1) {
    return _burnLiquidity(to);
  }

  function removeLiquidity(uint liquidity, uint minAmount0, uint minAmount1, address to) external nonReentrant returns (uint amount0, uint amount1) {
    require(liquidity > 0, "INSUFFICIENT_LIQUIDITY");
    
    // Transfer LP tokens to contract
    transfer(address(this), liquidity);
    
    // Call internal burn function
    (amount0, amount1) = _burnLiquidity(to);
    
    require(amount0 >= minAmount0, "INSUFFICIENT_ETH_AMOUNT");
    require(amount1 >= minAmount1, "INSUFFICIENT_TOKEN_AMOUNT");
    
    return (amount0, amount1);
  }

}