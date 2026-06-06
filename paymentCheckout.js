// =====================================
// Checkout / Payment Page Logic
// =====================================

// Get HTML elements
const cardNumberInput = document.getElementById("cardNumber");
const cardTypeText = document.getElementById("cardTypeText");
const pickupEstimate = document.getElementById("pickupEstimate");
const orderMessage = document.getElementById("orderMessage");
const paymentForm = document.getElementById("paymentForm");

// =====================================
// Detect Credit Card Type
// =====================================

function detectCardType(cardNumber) {
    const number = cardNumber.replace(/\D/g, "");

    if (/^4/.test(number)) {
        return "Visa";
    }

    if (/^(5[1-5]|2[2-7])/.test(number)) {
        return "Mastercard";
    }

    if (/^3[47]/.test(number)) {
        return "American Express";
    }

    if (/^6(?:011|5)/.test(number)) {
        return "Discover";
    }

    return "Unknown";
}

// Show card type while typing
if (cardNumberInput && cardTypeText) {
    cardNumberInput.addEventListener("input", function () {
        const cardType = detectCardType(cardNumberInput.value);
        cardTypeText.textContent = cardType;
    });
}

// =====================================
// Calculate Pickup Time
// =====================================

function calculatePickupTime() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    let totalItems = 0;

    cart.forEach(function (item) {
        totalItems += item.quantity || 1;
    });

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

    return {
        prepMinutes: prepMinutes,
        pickupTime: pickupTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };
}

// Show estimated pickup time when page loads
if (pickupEstimate) {
    const estimate = calculatePickupTime();

    pickupEstimate.textContent =
        "Estimated Pickup Time: " +
        estimate.pickupTime +
        " (" +
        estimate.prepMinutes +
        " minutes)";
}

// =====================================
// Validate Payment Information
// =====================================

function validatePaymentInfo() {
    const cardNumber = cardNumberInput.value.replace(/\D/g, "");
    const expiration = document.getElementById("expiration").value.trim();
    const cvv = document.getElementById("cvv").value.trim();
    const cardType = detectCardType(cardNumber);

    if (cardType === "Unknown") {
        return "Please enter a valid Visa, Mastercard, American Express, or Discover card.";
    }

    if (cardType === "American Express" && cardNumber.length !== 15) {
        return "American Express cards must have 15 digits.";
    }

    if (cardType !== "American Express" && cardNumber.length !== 16) {
        return "Card number must have 16 digits.";
    }

    if (!/^\d{2}\/\d{2}$/.test(expiration)) {
        return "Expiration date must be in MM/YY format.";
    }

    const parts = expiration.split("/");
    const month = parseInt(parts[0]);
    const year = parseInt("20" + parts[1]);

    if (month < 1 || month > 12) {
        return "Expiration month must be between 01 and 12.";
    }

    const today = new Date();
    const expirationDate = new Date(year, month);

    if (expirationDate <= today) {
        return "Credit card has expired.";
    }

    if (!/^\d{3}$/.test(cvv)) {
        return "CVV must be exactly 3 digits.";
    }

    return "";
}

// =====================================
// Submit Order
// =====================================

if (paymentForm) {
    paymentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const validationError = validatePaymentInfo();

        if (validationError) {
            orderMessage.textContent = validationError;
            orderMessage.style.color = "red";
            return;
        }

        const estimate = calculatePickupTime();

        const order = {
            customerName: document.getElementById("customerName")?.value || "",
            customerPhone: document.getElementById("customerPhone")?.value || "",
            cardType: cardTypeText.textContent,
            pickupTime: estimate.pickupTime,
            prepMinutes: estimate.prepMinutes,
            orderDate: new Date().toLocaleString()
        };

        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push(order);

        localStorage.setItem("orders", JSON.stringify(orders));

        orderMessage.textContent =
            "Order placed successfully! Estimated pickup time: " +
            estimate.pickupTime;

        orderMessage.style.color = "green";

        paymentForm.reset();
        cardTypeText.textContent = "Unknown";
    });
}
