//Manage user shopping cart
module.exports = function Cart(oldCart){ 
   
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
    //Add new item to the cart
    this.add = function(item, id){
        var storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = { item: item, qty: 0, newPrice: 0 };
        }
        storedItem.qty++;
        storedItem.newPrice = storedItem.item.newPrice * storedItem.qty;
        this.totalQty++;
        this.totalPrice += storedItem.item.newPrice;
    };
    //Reduce buy one item
    this.reduceByOne = function(id){
        this.items[id].qty--; 
        this.items[id].newPrice -= this.items[id].item.newPrice;
        this.totalQty--;
        this.totalPrice -= this.items[id].item.newPrice;

        if(this.totalPrice == 0){
            delete this.totalPrice;
        };

        if(this.items[id].qty <= 0){
            delete this.items[id];

        };
        if(this.totalQty == 0){
            delete this.totalQty;

        } 
    };
    //Generate array with items id
    this.generateArray = function () {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr; 
    }

}