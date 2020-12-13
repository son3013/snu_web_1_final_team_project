const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  name: String,
  key: String,

  level: { type: Number, default: 1 },
  levelUpExp : { type: Number, default: 25 }, //다음 레벨로 올라가기 위한 경험치 한도
  exp: { type: Number, default: 0 },

  maxHP: { type: Number, default: 10 },
  HP: { type: Number, default: 10 },
  str: { type: Number, default: 3 },
  def: { type: Number, default: 1 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  items: { type: Array }
});

// HP 증감
schema.methods.incrementHP = function (val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

// Exp 증감과 레벨 시스템
schema.methods.incrementExp = function (val) {
  this.exp += val;

  // 레벨 업 시 경험치 초기화 및 레벨, 경험치한도 증가(레벨당 40%씩), HP 100% 회복, str 1/def 0.5씩 증가
  if (this.exp >= this.levelUpExp) {
    this.exp -= this.levelUpExp;
    this.level += 1;
    this.levelUpExp = Math.floor(this.levelUpExp * 1.4);
    this.HP = this.maxHP;
    this.str += 1;
    this.def += 0.5;
  }
};

const Player = mongoose.model("Player", schema);

module.exports = {
  Player
};
