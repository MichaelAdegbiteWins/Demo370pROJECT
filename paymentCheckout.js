const TAX_RATE = 0.08875;

  const menuItems = [
    { name: "Almond Chicken", price: 12.99 },
    { name: "Beef & Broccoli", price: 13.99 },
    { name: "Chicken & Broccoli", price: 12.99 },
    { name: "Crab Rangoon", price: 7.99 },
    { name: "General Tso's Chicken", price: 13.99 },
    { name: "Egg Drop Soup", price: 4.99 },
    { name: "White Rice", price: 2.99 }
  ];

  let cart = JSON.parse(localStorage.getItem("paymentCart")) || [];

  const menuList = document.getElementById("menuList");
  const cartList = document.getElementById("cartList");
  const subtotalSpan = document.getElementById("subtotal");
  const taxSpan = document.getElementById("tax");
  const totalSpan = document.getElementById("total");
  const pickupEstimateSpan = document.getElementById("pickupEstimate");
  const orderMessage = document.getElementById("orderMessage");

  const cardInput = document.getElementById("cardNumber");
  const cardTypeText = document.getElementById("cardTypeText");
  const cardImage = document.getElementById("cardImage");

  function displayMenu() {
    menuList.innerHTML = "";

    menuItems.forEach(function(item, index) {
      const div = document.createElement("div");
      div.className = "menu-item";
      div.innerHTML = `
        <strong>${item.name}</strong><br>
        $${item.price.toFixed(2)}
        <button class="menu-button" onclick="addToCart(${index})">Add to Order</button>
      `;
      menuList.appendChild(div);
    });
  }

  function addToCart(index) {
    const selectedItem = menuItems[index];
    const existingItem = cart.find(function(item) {
      return item.name === selectedItem.name;
    });

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: 1
      });
    }

    updateCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
  }

  function changeQuantity(index, amount) {
    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      updateCart();
    }
  }

  function calculatePickupTime() {
    let totalItems = 0;

    cart.forEach(function(item) {
      totalItems += item.quantity;
    });

    if (totalItems === 0) {
      return "Add items to calculate";
    }

    let prepMinutes;

    if (totalItems <= 3) {
      prepMinutes = 15;
    } else if (totalItems <= 6) {
      prepMinutes = 25;
    } else if (totalItems <= 10) {
      prepMinutes = 35;
    } else {
      prepMinutes = 50;
    }

    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + prepMinutes);

    return pickupTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }) + " (about " + prepMinutes + " minutes)";
  }

  function updateCart() {
    localStorage.setItem("paymentCart", JSON.stringify(cart));
    cartList.innerHTML = "";

    if (cart.length === 0) {
      cartList.innerHTML = "<p>Your order is empty.</p>";
    }

    let subtotal = 0;

    cart.forEach(function(item, index) {
      subtotal += item.price * item.quantity;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <strong>${item.name}</strong><br>
        $${item.price.toFixed(2)} x ${item.quantity}
        <br>
        <button class="cart-button" onclick="changeQuantity(${index}, -1)">-</button>
        <button class="cart-button" onclick="changeQuantity(${index}, 1)">+</button>
        <button class="cart-button" onclick="removeFromCart(${index})">Remove</button>
      `;
      cartList.appendChild(div);
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    subtotalSpan.textContent = subtotal.toFixed(2);
    taxSpan.textContent = tax.toFixed(2);
    totalSpan.textContent = total.toFixed(2);
    pickupEstimateSpan.textContent = calculatePickupTime();
  }

  function detectCardType(cardNumber) {
    const number = cardNumber.replace(/\D/g, "");

    if (number.startsWith("4")) {
      return { name: "Visa", image: "/images/visa.png" };
    }

    if (number.startsWith("2") || number.startsWith("5")) {
      return { name: "Mastercard", image: "/images/mastercard.png" };
    }

    if (number.startsWith("34") || number.startsWith("37")) {
      return { name: "American Express", image: "/images/amex.png" };
    }

    if (number.startsWith("6")) {
      return { name: "Discover", image: "/images/discover.png" };
    }

    return { name: "Unknown", image: "" };
  }

  cardInput.addEventListener("input", function() {
    let cardNumber = cardInput.value.replace(/\D/g, "");

    if (cardNumber.length > 16) {
      cardNumber = cardNumber.substring(0, 16);
    }

    cardInput.value = cardNumber;

    const cardType = detectCardType(cardNumber);
    cardTypeText.textContent = "Card type: " + cardType.name;

    if (cardType.image !== "") {
      cardImage.src = cardType.image;
      cardImage.style.display = "block";
    } else {
      cardImage.src = "";
      cardImage.style.display = "none";
    }
  });

  document.getElementById("paymentForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const expiration = document.getElementById("expiration").value.trim();
    const cvv = document.getElementById("cvv").value.trim();

    if (cart.length === 0) {
      orderMessage.textContent = "Please add at least one item before placing an order.";
      return;
    }

    if (customerName === "" || customerPhone === "") {
      orderMessage.textContent = "Please enter your name and phone number.";
      return;
    }

    if (cardNumber === "" || expiration === "" || cvv === "") {
      orderMessage.textContent = "Please enter all payment information.";
      return;
    }

    const order = {
      customerName: customerName,
      customerPhone: customerPhone,
      specialInstructions: document.getElementById("specialInstructions").value.trim(),
      items: cart,
      subtotal: subtotalSpan.textContent,
      tax: taxSpan.textContent,
      total: totalSpan.textContent,
      cardType: detectCardType(cardNumber).name,
      pickupTime: pickupEstimateSpan.textContent,
      date: new Date().toLocaleString()
    };

    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    savedOrders.push(order);
    localStorage.setItem("orders", JSON.stringify(savedOrders));

    orderMessage.textContent = "Order placed successfully! Estimated pickup time: " + order.pickupTime;

    cart = [];
    localStorage.removeItem("paymentCart");
    updateCart();
    document.getElementById("paymentForm").reset();
    cardTypeText.textContent = "Card type: Unknown";
    cardImage.style.display = "none";
  });

  displayMenu();
  updateCart();
