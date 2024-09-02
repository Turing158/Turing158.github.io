---
title: Minecraft登录认证方式
description: 通过网络请求方式，进行一系列的认证，获取Minecraft的登录Token，进而登录Minecraft，获取用户信息
date: 2024-7-3 12:00:00
categories:
 - Minecraft
 - Microsoft
 - API
 - XBoxLive
tags:
  - Minecraft
  - Microsoft
  - API
  - XBoxLive
---



### 零、准备工作

在进行Minecraft验证之前，需要准备一些东西

- [申请的Azure软件id](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
- 能够网络请求的软件或编程中所需要的网络请求库
- 通过[Mojang提交应用程序访问Minecraft API申请](https://help.minecraft.net/hc/en-us/articles/16254801392141)

---

### 一、获取机器码

**POST/GET** https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode

#### Headers[默认传输表单就行]

| Key            | Value                               |
| -------------- | ----------------------------------- |
| `Content-Type` | `application/x-www-form-urlencoded` |

#### Body

| Key       | Value                                                        |
| --------- | ------------------------------------------------------------ |
| client_id | 你所申请的[Azure软件id](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps) |
| scope     | XboxLive.signin offline_access                               |

#### 成功返回	json

```json
{
    "user_code": "8位用户需要的代码",
    "device_code": "一长串机器码，需要保存，后续要用",
    "verification_uri": "https://www.microsoft.com/link",
    "expires_in": 900,
    "interval": 5,
    "message": "To sign in, use a web browser to open the page https://www.microsoft.com/link and enter the code 8位用户需要的代码 to authenticate."
}
```

---

### 二、获取Token

**POST** https://login.microsoftonline.com/consumers/oauth2/v2.0/token

#### Headers[默认传输表单就行]

| Key            | Value                               |
| -------------- | ----------------------------------- |
| `Content-Type` | `application/x-www-form-urlencoded` |

#### Body

| Key         | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| client_id   | 你所申请的[Arur软件id](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps) |
| grant_type  | urn:ietf:params:oauth:grant-type:device_code                 |
| device_code | 第一步获取的device_code                                      |

#### 成功返回	json

```json
{
    "token_type": "Bearer",
    "scope": "XboxLive.signin",
    "expires_in": 3599,
    "ext_expires_in": 3599,
    "access_token": "MicrosoftToken，需要保存",
    "refresh_token": "刷新用token，以后登录可用，可以省略第一步"
}
```

#### 错误返回

```json
{
    "error": "错误码",
    "error_description": "错误详细信息",
    "error_codes": [
        //错误代码
    ],
    "timestamp": "时间",
    "trace_id": "可帮助诊断的请求唯一标识符[无需理会]",
    "correlation_id": "用来将RPC的响应和请求关联起来[无需理会]"
}
```

这种情况，一般就是用户没有完成微软的登录验证，一般这个请求是隔几秒请求一次，直到用户成功登录验证，如果用户完成了所需步骤，那就是传输数据出问题，或者验证超时，一般**900秒**超时，可以看第一步请求返回的**expires_in**

---

### 三、XBox身份验证

**POST** https://user.auth.xboxlive.com/user/authenticate

#### Headers

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

#### Body[Json格式]

这里的**<access_token>**就是**第二步**的返回的**access_token**

```json
{
    "Properties": {
        "AuthMethod": "RPS",
        "SiteName": "user.auth.xboxlive.com",
        "RpsTicket": "d=<access_token>"
    },
    "RelyingParty": "http://auth.xboxlive.com",
    "TokenType": "JWT"
}
```

#### 成功返回	json

```json
"IssueInstant": "时间",
    "NotAfter": "时间",
    "Token": "这是XBoxLive的Token，要保存",
    "DisplayClaims": {
        "xui": [
            {
                "uhs": "用户信息哈希值，要保存"
            }
        ]
    }
}
```

#### 错误返回

对，就是返回**空**

```json

```

---

### 四、XSTS 身份验证

**POST** https://xsts.auth.xboxlive.com/xsts/authorize

#### Headers

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

#### Body[Json格式]

这里的**<xbl_token>**就是**第三步**的返回的**Token**

```json
{
    "Properties": {
        "SandboxId": "RETAIL",
        "UserTokens": [
            "<xbl_token>"
        ]
    },
    "RelyingParty": "rp://api.minecraftservices.com/",
    "TokenType": "JWT"
}
```

#### 成功返回	json

```json
{
    "IssueInstant": "时间",
    "NotAfter": "时间",
    "Token": "XSTS的token，保存",
    "DisplayClaims": {
        "xui": [
            {
                "uhs": "与上一步的uhs要一样"
            }
        ]
    }
}
```

#### token解析错误返回

```json
{
    "Identity": "0",
    "XErr": 2148916262
}
```

#### token为空或json格式错误返回

你没看错，就是返回**空**

```json

```

---

### 五、获取MinecraftToken

**POST** https://api.minecraftservices.com/authentication/login_with_xbox

#### Headers

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

#### Body[Json格式]

这里的**<uhs>**就是**第三、四步**的返回的**ush**，是一样的

这里的**<xsts_token>**就是**第四步**的返回的**Token**

```json
{
    "identityToken": "XBL3.0 x=<uhs>;<xsts_token>"
}
```

#### 成功返回	json

```json
{
    "username": "这里不用管，不是Minecraft的UUID",
    "roles": [],
    "metadata": {},
    "access_token": "这是Minecraft的Token，需要保存",
    "expires_in": 86400,
    "token_type": "Bearer"
}
```

#### 错误返回

```json
{
    "path": "/authentication/login_with_xbox",
    "error": "错误代码"
}
```



---

### 六、获取MinecraftUUID

**GET** https://api.minecraftservices.com/minecraft/profile

#### Headers

这里的**<minecraft_token>**是**第五步**的返回的**access_token**，而且**Bearer**后面是有**一个空格**的喔！

| Key             | Value                      |
| --------------- | -------------------------- |
| `Authorization` | `Bearer <minecraft_token>` |

#### 成功返回	json

```json
{
    "id": "Minecraft的UUID",
    "name": "Minecraft的用户名",
    "skins": [
        {
            "id": "皮肤ID[不用理]",
            "state": "ACTIVE",
            "url": "获取皮肤图片的网址",
            "textureKey": "图片的key[不用理]",
            "variant": "CLASSIC"
        }
    ],
    "capes": [
        {
            "id": "披风ID[不用理]",
            "state": "INACTIVE",
            "url": "获取披风图片的网址",
            "alias": "披风名"
        },{
            //可以是多个披风，与上面格式一样
        }
    ],
    "profileActions": {}
}
```

#### 错误或未拥有Minecraft返回

```json
{
    "path": "/minecraft/profile"
}
```

