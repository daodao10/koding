// function Animal() {　　　　
//     this.species = "动物";　　
// }

// function Cat(name, color) {　　　　
//     this.name = name;　　　　
//     this.color = color;　　
// }



// //=> inherit 1: directly call constructor
// function Animal() {　　　　
//     this.species = "动物";　　
// }

// function Cat(name, color) {　　　　
//     Animal.apply(this, arguments);　　　　
//     this.name = name;　　　　
//     this.color = color;　　
// }　　



// // //=>inherit 2: prototype
// function Animal() {　　　　
//     this.species = "动物";
//     console.log('called');
// }

function Cat(name, color) {　　　　
    this.name = name;　　　　
    this.color = color;　　
}

// Cat.prototype = new Animal();
// // 任何一个prototype对象都有一个constructor属性，指向它的构造函数
// // 上一行之后，Cat实例的构造函数会变成Animal，这会导致继承链的紊乱，因此我们必须手动纠正，将Cat.prototype对象的constructor值改为Cat。
// Cat.prototype.constructor = Cat;




// //2的做法，效率比较低，每个继承Animal的子类需要执行和建立Animal的实例，比较浪费内存
// //示例:
// // function Dog(name, color){
// // 	this.name = name;　　　　
// //     this.color = color;　　
// // }
// // Dog.prototype = new Animal();
// // Dog.prototype.constructor = Dog;
// //优化解决问题=>inherit 3: directly prototype
// function Animal() {}　　
// Animal.prototype.species = "动物";

// // 将Cat的prototype对象，然后指向Animal的prototype对象，这样就完成了继承
// Cat.prototype = Animal.prototype;　　
// Cat.prototype.constructor = Cat;
// // 问题引发：现在，Cat.prototype 和 Animal.prototype 指向了同一个对象，那么任何对Cat.prototype的修改，都会反映到Animal.prototype
// // console.log('Animal.prototype.constructor:', Animal.prototype.constructor);


//=>improve: 利用空对象作为中介
function Animal() {}　　
Animal.prototype.species = "动物";

// //Cat.prototype = Animal.prototype;
// //=>
// var F = function() {};　
// F.prototype = Animal.prototype;
// Cat.prototype = new F(); // F不占什么内存
// Cat.prototype.constructor = Cat;


//=>进一步演化，我们封装F的步骤
function extend(Child, Parent) {　　　　
    var F = function() {};　　　　
    F.prototype = Parent.prototype;　　　　
    Child.prototype = new F();　　　　
    Child.prototype.constructor = Child;　　　　
    Child.uber = Parent.prototype; //这一行放在这里，只是为了实现继承的完备性，备用性质(暂时无用)。uber是一个德语词，意思是"向上"、"上一层"　　
}
extend(Cat, Animal);



// //=>inherit 4: "拷贝"方法实现继承
// function Animal() {}　　
// Animal.prototype.species = "动物";

// function extend2(Child, Parent) {　　　　
//     var p = Parent.prototype;　　　　
//     var c = Child.prototype;　　　　
//     for (var i in p) {　　　　　　
//         c[i] = p[i];　　　　　　
//     }　　　　
//     c.uber = p;　　
// }
// extend2(Cat, Animal);




var cat1 = new Cat("大毛", "黄色");　　
cat1.__proto__.species = "修改动物 Cat";
cat1.species = "修改动物 self";
Animal.prototype.species = "修改动物 ALL";
// 优先级 自己，自己的prototype，prototype的prototype
console.log(Cat.prototype.constructor.prototype)
console.log(cat1.species);

function Dog(name, color) {
    this.name = name;　　　　
    this.color = color;　　
}
extend(Dog, Animal);
var dog = new Dog("大毛", "黄色");　
console.log(dog.species);
console.log('Dog.prototype.constructor:', Dog.prototype.constructor);

var cat2 = new Cat("红毛", "红色");　　
console.log(cat2.species);

console.log('Cat.prototype.constructor:', Cat.prototype.constructor);
// 每一个实例也有一个constructor属性，默认调用prototype对象的constructor属性
console.log('cat1.constructor === Cat.prototype.constructor:', cat1.constructor === Cat.prototype.constructor);
console.log('cat1.constructor === cat1.__proto__.constructor:', cat1.constructor === cat1.__proto__.constructor);

console.log('Animal.prototype.constructor:', Animal.prototype.constructor);
console.log('Cat.prototype.uber:', Cat.prototype.uber);

console.log(cat1);

