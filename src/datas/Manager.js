const fs = require("fs");

class Manager {
  constructor() {}
}

class ConstantManager extends Manager {
  constructor(datas) {
    super();
    this.gameName = datas.gameName;
  }
}

class MapManager extends Manager {
  constructor(datas) {
    super();
    this.id = datas.id;
    this.fields = {};

    datas.fields.forEach((field) => {
      this.fields[`${field[0]}_${field[1]}`] = {
        x: field[0],
        y: field[1],
        description: field[2],
        canGo: field[3],
        events: field[4]
      };
    });
  }

  getField(x, y) {
    return this.fields[`${x}_${y}`];
  }
}

class MonsterManager extends Manager {
  constructor(datas) {
    super();
    this.id = 1;
    this.monsters = [];

    datas.forEach((monster) => {
      this.monsters.push(monster);
    });
  }

  getRandomMonster() {
    const arrayLength = this.monsters.length;
    const rand_num = Math.floor(Math.random() * (arrayLength)); 
    return this.monsters[rand_num];
  }
}

class ItemManager extends Manager {
  constructor(datas) {
    super();
    this.id = 1;
    this.items = [];

    datas.forEach((item) => {
      this.items.push(item);
    });
  }

  getRandomItem() {
    const arrayLength = this.items.length;
    const rand_num = Math.floor(Math.random() * (arrayLength)); 
    return this.items[rand_num];
  }
}

const constantManager = new ConstantManager(
  JSON.parse(fs.readFileSync(__dirname + "/constants.json"))
);

const mapManager = new MapManager(
  JSON.parse(fs.readFileSync(__dirname + "/map.json"))
);

const monsterManager = new MonsterManager(
  JSON.parse(fs.readFileSync(__dirname + "/monsters.json"))
);

const itemManager = new ItemManager(
  JSON.parse(fs.readFileSync(__dirname + "/items.json"))
);

module.exports = {
  constantManager,
  mapManager,
  monsterManager,
  itemManager
};
