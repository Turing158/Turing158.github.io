---
title: 使用SpringBoot
description: springboot是java的一个框架，他将spring框架的初始化和搭建进行了简化，让你不到一分钟能够使用Spring的内容，只需一些简单的配置
date: 2024-2-7 21:52:00
categories:
 - SpringBoot
tags:
---

[csdn](https://blog.csdn.net/weixin_46396315/article/details/135996056)

# 创建项目并使用SpringBoot

------

## 介绍

springboot是java的一个框架，他将spring框架的初始化和搭建进行了简化，让你不到一分钟能够使用Spring的内容，只需一些简单的配置



## 创建Maven项目

***

1. 在IDEA里**文件** > **新建** > **项目**

   ![image-20240130214504538](https://www.z4a.net/images/2024/02/22/image-20240130214504538.png)

2. 选择**新建项目**，名称随意，主要是构建系统选择**Maven**，**JDK选择17***[因为要使用SpringBoot3需要JDK17的支持]*

   ![image-20240130214707217](https://www.z4a.net/images/2024/02/22/image-20240130214717928.png)

## 配置Pom

***

创建好了之后，看pom.xml

groupId可以起一个你自己想起的，例如：com.xxx

其他的就不需要怎么动

![image-20240130231405249](https://www.z4a.net/images/2024/02/22/image-20240130231405249.png)

1. 添加**Parent**

   在**version**标签下添加

    ```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
        <!-- 版本可以自己选，但是3.0.0以上必须要JDK17，3.0.0以下需要JDK1.8以上 -->
    </parent>
    ```

2. 添加**dependencies**

   在**parent**标签下添加**dependencies**标签

   ```xml
   <dependencies>
   </dependencies>
   ```

   > **dependencies**标签里需要填什么呢？通过[**mvnrepository**](https://mvnrepository.com/)来添加**dependency**，里面包含了很多的maven的包和版本，而要使用SpringBoot，需要添加一个包含**spring-boot-starter**依赖的，添加**dependency**可以让**SpringBoot**项目更加的牛逼。*相当于一个软件，然后从里面添加插件*

   所以我们得在**dependencies**标签里添加一个**spring-boot-starter-web**的**dependency**

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   ```

3. 创建**软件包**和**启动类**

   **SpringBoot**需要一个**主类**，能让**SpringBoot**运行起来

   1. 创建这个类之前，需要创建一个**软件包**，**软件包**的路径就是你**pom.xml**里的**groupId**，在我这里为com.springDemo，记住创建的是软件包，不是目录，判断是否有创建正确就在文件管理器里面浏览一下，java目录下是否是com/springDemo

   2. 在**com.springDemo**下创建一个**Application.java**，这个类，就是用作**springBoot**的**启动类**

      > - **@SpringBootApplication**注解用于标注这个类为**springBoot**的**启动类**
      > - 通过**SpringApplication.run()**来启动**SpringBoot**,第一个参数就是启动类**Application.class**，第二个参数为主函数的**args**
      >
      
      ```java
      //application.java
      @SpringBootApplication
      public class Application {
          public static void main(String[] args) {
              SpringApplication.run(Application.class,args);
          }
      }
      ```

4. 启动测试

   一般来说，启动了之后是不会有什么报错或者直接报错后停止的
   
   ![image-20240201020341498](https://www.z4a.net/images/2024/02/22/image-20240201020341498.png)



# SpringBoot使用Web

***

*由于在前面已经将**spring-boot-starter-web**加入到**dependency**，所以这里就不用添加了*

1. 添加**spring-boot-starter-thymeleaf**，将下面代码复制粘贴到**dependencies**标签里

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-thymeleaf</artifactId>
   </dependency>
   ```

   > 这里就不得不解释**thymeleaf**是什么了，到时候会出一篇关于**thymeleaf**的教学，thymeleaf是一种模板引擎，可以在html中添加标签属性，使得**html**通过**MVC**和**thymeleaf**的处理，让**html**变得更加灵活

2. 在**com.springDemo**下创建**config**软件包，并在**config**软件包下创建webConfig.java，用于配置web的静态路径`[主要是解决css和js无法加载到页面上的问题]`

   ```java
   //webConfig.java
   @Configuration
   public class webConfig implements WebMvcConfigurer {
       public void addResourceHandlers(ResourceHandlerRegistry registry){
           registry.addResourceHandler("/**")
                   .addResourceLocations("classpath:/templates/", "classpath:/templates/");
       }
   }
   ```

3. 在**resources**文件夹里创建**目录templates**，然后再创建一个html作为测试[这里为**test.html**]

   ```html
   <!DOCTYPE html>
   <html lang="en">
       <head>
           <meta charset="UTF-8">
           <title>Title</title>
       </head>
       <body>
           <h1>Hi,Welcome</h1>
       </body>
   </html>
   ```

4. 在**com.springDemo**下创建**controller**软件包，再创建**testController.java**

   ```java
   //testController.java
   @Controller
   public class testController {
       @RequestMapping("/")
       public String test1(){
           return "test";
       }
   }
   ```

   解释一下这个Controller

   - **@Controller**注解：将java类加入Bean管理，并将这个类变为控制类
   - **@RequestMapping**注解：将方法能通过**url**访问,即访问注解里的值，可以运行这个方法，这个注解的**method**值默认为**GET**，也就是对应**html**的**GET**请求
   - 方法的类型需要**String**类型：方法的返回值是有点说法的，如果字符串为"**redirect:**"开头，即**重定向***[了解过javaweb都知道吧]*，例如："**redirect:/test**"；如果字符串为**普通字符串**，即返回对应路径的**html**文件，例如："test/test"=>这个的路径就为**resources/templates/test/test.html**

5. 在application.java启动类启动，并打开浏览器输入**localhost:8080**即可查看结果

![image-20240207204059405](https://www.z4a.net/images/2024/02/22/image-20240207204059405.png)

## application

------

我们先在**resources**文件下新建一个文件**application.properties**或**application.yml**，这个文件是用来设置Springboot的一些配置的，但是目前还没有用到，所以先搁置着

![image-20240202162603439](https://www.z4a.net/images/2024/02/22/image-20240202162603439.png)

# SpringBoot对于现在的使用方式

------

按现情况一般来说，已经很少人使用前后端不分离的模式，就不会单纯的让后端将数据处理完，还要将页面通过模板引擎渲染出来，这不仅让性能下降，在团队中也不好沟通和交流，现在的Springboot大部分都是用来处理数据，然后返回**json**格式给前端

## @RequestMapping注解的替代

我们在编写**Controller**控制类的时候，如果要让浏览器访问到，就需要使用**@RequestMapping**注解，并在里面填写相应的值，而在浏览器中，发送请求分两种方式"**GET**"、"**POST**"，而**@RequestMapping**注解的**method**的默认值为**GET**，也就是**GET请求**，但是也能收到浏览器发来的POST请求，这会使得一些*不法分纸搞搞震*，让你很难受，所以需要用到更好的注解！**@GetMapping、@PostMapping**

- @GetMapping：用于GET请求
- @PostMapping：用于POST请求

```java
@GetMapping("/testGet")
public String test2(){
    System.out.println("使用了get请求访问");
    return "test";
}
@PostMapping("/testPost")
public String test3(){
    System.out.println("使用了post请求访问");
    return "test";
}
```

## 使用Json格式

我们发数据给前端的时候，不能就发一串数据，而是采用**json**格式发送

1. 新建一个**软件包**名为**entity**，里面再创建一个类**ResultData.java**，将**构造函数和get、set方法**添加上去

   ```java
   public class ResultData {
       private String status;
       private String msg;
       public ResultData() {}
       public ResultData(String status, String msg) {
           this.status = status;
           this.msg = msg;
       }
       public String getStatus() {
           return status;
       }
       public void setStatus(String status) {
           this.status = status;
       }
       public String getMsg() {
           return msg;
       }
       public void setMsg(String msg) {
           this.msg = msg;
       }
   }
   ```

   到时候，方法返回的就是这个类

2. 在**controller**里新建一个测试类**test1Controller.java**

   **@ResponseBody**注释就是将方法体返回的不是页面，返回的是json格式

   **new**一个**ResultData**去给这个方法返回

   ```java
   @Controller
   public class test1Controller {
       @GetMapping("/test1")
       @ResponseBody
       public ResultData test1(){
           ResultData rd = new ResultData("200", "成功");
           return rd;
       }
   }
   ```

   但是每个方法都要使用**@ResponseBody注释**才能返回**json**格式有点麻烦，但是其实将**@Controller**换成**@RestController**就不需要再用**@ResponseBody注释**，简化了代码，下面才是最终的代码

   ```java
   @RestController
   public class test1Controller {
       @GetMapping("/test1")
       public ResultData test1(){
           ResultData rd = new ResultData("200", "成功");
           return rd;
       }
   }
   ```

3. 启动测试

   ![image-20240207204039342](https://www.z4a.net/images/2024/02/22/image-20240207204039342.png)

Springboot的基本用法就这些了，如果还有什么补充，尽管提出
