const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { text } = require("express");

const { constantManager, mapManager, monsterManager, itemManager } = require("./datas/Manager");
const { Player } = require("./models/Player");
const { PlayerItem } = require("./models/PlayerItem");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

mongoose.connect(
  "mongodb+srv://admin:admin@cluster0.9z89d.mongodb.net/Cluster0?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(" ");
  if (bearer !== "Bearer") return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get("/", (req, res) => {
  res.render("index", { gameName: constantManager.gameName });
});

app.get("/game", (req, res) => {
  res.render("game");
});

app.post("/signup", async (req, res) => {
  const { name } = req.body;

  if (await Player.exists({ name })) {
    return res.status(400).send({ error: "Player already exists" });
  }

  const player = new Player({
    name,
    maxHP: 10,
    HP: 10,
    str: 5,
    def: 5,
    x: 0,
    y: 0
  });

  const key = crypto.randomBytes(24).toString("hex");
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.get("/init", async (req, res) => {
  res.render("init")
})



// 사용자가 몬스터 공격하는 턴에서 공격할때
/*
  _player : player model instance
  _monster : monster instance
  return : Monster 처치 시 1, 처리 실패 시 monster.hp 반환
*/
const attackMonster = async (_player, _monster) => {
  if ((_player.str - _monster.def) > 0) {
    _monster.hp -= (_player.str - _monster.def);
    console.log(_monster.hp);

    // Monster 처치
    if (_monster.hp <= 0){
      _player.incrementExp(_monster.exp);
      await _player.save()
      return 1
    };
  return _monster.hp
  };
};


// 몬스터가 플레이어 공격하는 턴에서 공격할때
/*
  _player : player model instance
  _monster : monster instance
  return : 사용자 사망 시 1, 처리 실패 시 player 줄어든 hp 저장
*/
const getAttacked = async (_player, _monster) => {
  if ((_monster.str - _player.def) > 0) {
    _player.incrementHP(-(_monster.str - _player.def));

    // Player 사망
    if (_player.HP <= 0) {
        x = 0, y = 0;
        field = mapManager.getField(x, y);
        _player.x = x;
        _player.y = y;
        _player.HP = _player.maxHP;
        await _player.save();
        return 1;
      }
    await _player.save()
  };
};


// 사용자가 아이템을 획득했을 때 
/*
  _player : player model instance
  _item : item instance
*/
const getItem = async (_player, _item) => {
  // 사용자 - 아이템 별도 Model로 저장
  playerItem = new PlayerItem({
    player: _player,
    itemId: _item.id
  });
  await playerItem.save()

  // 아이템 효과 사용자에 반영
  if (Object.keys(_item).includes('str')) _player.str += _item.str;
  if (Object.keys(_item).includes('def')) _player.def += _item.def;
  await _player.save()
};


app.post("/action", authentication, async (req, res) => {
  const { action } = req.body;
  
  const player = req.player;
  console.log(action, player.x, player.y);
  let event = null;
  let field = null;
  let actions = [];
  if (action === "query") {
    field = mapManager.getField(req.player.x, req.player.y);
    console.log(field);
  } else if (action === "move") {
    const direction = parseInt(req.body.direction, 0); 
    // 0 북. 1 동 . 2 남. 3 서.
    // [손정현 / 유호영] TO DO: 조건이 10x10 지도를 만드는건데, 현재 저희는 (0,0) (0,1) (1,0) (1,1) 밖에 되지 않아요.
    // 10 x 10 지도를 만들어주세요.
    // 또, 지도 끝 부분에 도착하면 다른데로 더 못가게 해주세요.
    let x = req.player.x;
    let y = req.player.y;
    if (direction === 0) {
      y -= 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y += 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    const events = field.events;
    const actions = [];

    if (events.length > 0) {
      // [이종인] 확률별로 이벤트 발생하도록 변경
      const event1 = events[0];
      const event2 = events[1];
      const rand_num = Math.floor(Math.random() * 100) + 1;
      let _event = {};

      if (rand_num <= event1.percent) {
        _event = events[0];
      } else if (event1.percent < rand_num <= event1.percent+event2.percent) {
        _event = events[1];
      } else {
        _event = events[2];
      }
      
      if (_event.type === "battle") {
        // [완료 - 박상진] TO DO: 종인이 대략 작성해놓은 코드를 검토해주세요. 경험치와 레벨링 기능을 추가해주세요.
        // 이벤트 별로 events.json 에서 불러와 이벤트 처리하라고 했는데, 이부분도 시도해주시면 감사하겠습니다.ㅌ

        // 몬스터 등장
        monster = monsterManager.getRandomMonster();
        event = { description: `${monster.name}와(과) 마주쳐 싸움을 벌였다.` };

        // 싸움 시작 : Player와 Monster가 순서대로 한대씩 때림
        while (true) {
          // Player 공격 턴
          attackResult = await attackMonster(player, monster);
          if (attackResult===1) {
            event.result = `${monster.name}을 처치하였습니다!`;
            break;
          } else {
            monster.hp = attackResult;
          }
          console.log(`Hi. ${monster.name} HP: ${monster.hp}`);

          // Monster 공격 턴. 
          let isKilled = await getAttacked(player, monster);
          if (isKilled===1) {
            event.result = `당신은 ${monster.name}에게 처치당했습니다..GAME OVER`;
            break;
          };
        };
      } else if (_event.type === "item") {
        // [완료 : 박상진] TO DO: 아이템일 경우, 사용자가 랜덤한 아이템을 획득. 사용자 str, def에 반영. 
        item = itemManager.getRandomItem();
        event = { description: `${item.name}을(를) 획득하였다.`};
        await getItem(player, item)
      }
    }
    console.log(player.x, player.y);
    await player.save();
  }

  field.canGo.forEach((direction, i) => {
    let text = '';
    if (direction === 1) {
      if (i === 0) {
        text = '↑'
      } else if (i === 1) {
        text = '→'
      } else if (i === 2) {
        text = '↓'
      } else if (i === 3) {
        text = '←'
      }
      actions.push({
        url: "/action",
        text: text,
        params: { direction: i, action: "move" }
      });
    }
  });

  return res.send({ player, field, event, actions });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});



