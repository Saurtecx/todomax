const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const port = process.env.PORT || 8000;

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}))
app.use(express.static("public"));

mongoose.connect('mongodb://saurtecx:saurabhmishra@cluster0-shard-00-00.ne0qs.mongodb.net:27017,cluster0-shard-00-01.ne0qs.mongodb.net:27017,cluster0-shard-00-02.ne0qs.mongodb.net:27017/?ssl=true&replicaSet=atlas-aede7j-shard-0&authSource=admin&retryWrites=true&w=majority', {
useNewUrlParser: true,
useUnifiedTopology: true ,
useFindAndModify: false
});

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Add your List Item..."
});

const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

Item.find({}, function(err, foundItems){
  if(foundItems.length === 0){
    Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err);
      } else{
        console.log("Successfully saved default items to DB.");
      }
    });
    res.render("list", {listTitle: "X-List", newListItems: defaultItems});
  } else {
    res.render("list", {listTitle: "X-List", newListItems: foundItems});
  }
});
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "X-List"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);

  });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "X-List"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }

})

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, () => {
  console.log(`listening to the port no at ${port}`);
})
