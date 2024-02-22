---
title: SpringBoot-使用-Thymeleaf
description: Thymeleaf是一种新的模板引擎，完全可以代替传统的JSP，一个html页面效果做好后，只需在其需要后端控制变化的标签里添加属性，让html从静态页面变成动态页面，学习thymeleaf，只需要学习他的一些标签的用法和它内嵌的一些变量即可。顺带一说，学习过vue在html上的那些标签[v-if、v-for...]的，相对于会上手的快一些
date: 2024-2-8 18:23:32
categories:
 - SpringBoot
tags:
---


# 介绍

------

**Thymeleaf**是一种新的**模板引擎**，完全可以代替传统的**JSP**，一个**html**页面效果做好后，只需在其需要后端控制变化的标签里添加属性，让**html**从静态页面变成动态页面，学习**thymeleaf**，只需要学习他的一些**标签**的**用法**和它**内嵌**的一些变量即可。顺带一说，学习过**vue**在**html**上的那些标签*[v-if、v-for...]*的，相对于会上手的快一些

# 使用

------

## 添加pom

------

想要在springboot上使用thymeleaf，需要添加**spring-boot-starter-thymeleaf**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

## 如何使用

------

1. 配置静态资源配置**webConfig.java**

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

2. 当然这些在**html**上还不能用，还需要在**html**标签上添加**xmlns:th**属性，值为**http://www.thymeleaf.org**

   ```html
   <!DOCTYPE html>
   <html lang="en" xmlns:th="http://www.thymeleaf.org">
       <head>
           <meta charset="UTF-8">
           <title>Title</title>
       </head>
       <body>
       </body>
   </html>
   ```
   
3. 到这里，你就可以愉快的使用**thymeleaf**

## 常用的themeleaf标签

------

| 标签           | 用途                            | 例子                                                |
| :------------- | ------------------------------- | --------------------------------------------------- |
| [th:id]()      | 替换当前标签的id属性            | `<div th:id="'divId' + ${id}"></div>`               |
| [th:if]()      | 判断事件                        | `<div th:if="${value == 'right'}">show</div>`       |
| [th:unless]()  | 判断事件[相当于else]            | `<div th:unless="${value == 'error'}">show</div>`   |
| [th:each]()    | 循环事件                        | `<tr th:each="value : ${list}"><td>value</td></tr>` |
| [th:text]()    | 替换标签内容                    | `<div th:text="${text}">none</div>`                 |
| [th:utext]()   | 替换标签内容，支持html的文本    | `<div th:utext="${text}">none</div>`                |
| [th:value]()   | 替换标签value属性               | `<input th:value="${value}"/>`                      |
| [th:style]()   | 设置标签样式                    | `<div th:style="'color:'+${value}">none</div>`      |
| [th:onclick]() | 设置标签点击事件                | `<div th:onclick="'func('+${value}+')'">none</div>` |
| [th:href]()    | 设置标签链接                    | `<a th:href="'www.'+${value}"+'.com'>none</a>`      |
| [th:switch]()  | 分支判断，需要与th:case配合使用 | `<div th:switch="${value}"></div>`                  |
| [th:case]()    | th:switch的分支                 | `<span th:case="'right'">none</span>`               |
| th:src         | 设置img标签的图片路径           | `<img th:src="'./fold/'+${value}"/>`                |
| th:action      | 替换表单的action属性            | `<form th:action="@{/login}">`                      |
| th:with        | 可变量进行赋值运算              | `<div th:with="value = 1 + 2"></div>`               |



 ## 常用标签的用法

------

在**Springboot**中，如果要将数据传输到**html**页面上有两种方法，一种是通过前端**ajax**发请求后，后端返回数据；一种是通过将数据存入**session**，再通过**thymeleaf**访问**session**存入的数据，处理并显示出来，这里就是通过第二种

推荐搭配[**demo**](#demo)使用。*代码里的class标签都不需要理，样式而已，下面的代码一般第一个div用来显示，第二个div用来操作*

![image-20240207031937219](https://www.z4a.net/images/2024/02/22/image-20240207031937219.png)

### th:id

> **th:id**属性的作用：替换当前标签的id属性值

1. 这里通过**id**来设置样式，**id**为**colorRed**文字为红色，**id**为**colorBlue**文字为蓝色

   ```html
   <div>
       <h1>th:id</h1>
       <div class="testText" id="colorRed" th:id="'color'+${session.color}">测试文字Test_Text</div>
       <h4>tips：id为colorRed文字为红色，id为colorBlue文字为蓝色</h4>
   </div>
   <br/>
   <div>
       <a class="btn p10-20 red" href="/changeIdRed">变红</a>
       <a class="btn p10-20 blue" href="/changeIdBlue">变蓝</a>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 在**testController.java**来设置**session.color**的值

   ```java
   @RequestMapping("/changeIdRed")
   public String changeIdRed(HttpSession session){
       session.setAttribute("color","Red");
       return "redirect:/test1";
   }
   @RequestMapping("/changeIdBlue")
   public String changeIdBlue(HttpSession session){
       session.setAttribute("color","Blue");
       return "redirect:/test1";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207031959922](https://www.z4a.net/images/2024/02/22/image-20240207031959922.png)

### th:if | th:unless

> **th:if**属性的作用：判断属性值**True**或**False**，**True**为显示，**False**为隐藏[不能被审查元素找到]
>
> **th:unless**属性的作用：判断属性值**True**或**False**，与**th:if**反过来

1. 在第一个**大div**里的两个div标签里分别设置**th:if**和**th:unless**属性，第二个**大div**里**a标签**的**href**设置每个控制类相应的**url**

   第二个**大div**里前两个**a标签**的**th:if**和**th:unless**与第一个**大div**里**div**相反

   ```html
   <div>
       <h1>th:id|th:unless</h1>
       <div class="testText" th:if="${session.test2Value}">test2Value=True</div>
       <div class="testText" th:unless="${session.test2Value}">test2Value=False</div>
       <h4>tips：点击下面切换test2Value的值</h4>
   </div>
   <br/>
   <div>
       <a class="btn p10-20 blue" th:if="${!session.test2Value}" href="/changeTest2True">True</a>
       <a class="btn p10-20 red" th:unless="${!session.test2Value}" href="/changeTest2False">False</a>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 在**testController.java**来设置**session.test2Value**的值

   ```java
   @RequestMapping("/changeTest2True")
   public String changeTest2True(HttpSession session){
       session.setAttribute("test2Value",true);
       return "redirect:/test2";
   }
   @RequestMapping("/changeTest2False")
   public String changeTest2False(HttpSession session){
       session.setAttribute("test2Value",false);
       return "redirect:/test2";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032023404](https://www.z4a.net/images/2024/02/22/image-20240207032023404.png)

### th:text | th:utext

> **th:text**属性的作用：将标签里的文字替换，不会识别属性值里**html**的标签
>
> **th:utext**属性的作用：与上面作用相同，但是会识别属性值里**html**的标签

1. 在第一个**大div**里将**th:text**和**th:utext**分别设置在**两个div**里

   ```html
   <div>
       <h1>th:text|th:utext</h1>
       <div th:text="${session.test3text}"></div>
       <br>
       <h4>你会发现上面与下面的文字很不同，但是是同一个字符串</h4>
       <br>
       <div th:utext="${session.test3text}"></div>
   </div>
   <br/>
   <div>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 在**testController.java**设置**session.test3text**的值

   ```java
   @RequestMapping("/test3")
   public String test3(HttpSession session){
       session.setAttribute("page",3);
       String text = "<span color=‘red’>This is a test</span><br/><span color=‘blue’>测试文字</span><br/><span color=‘green’>テストテキスト</span><br/><span color=‘yellow’>Тестовый текст</span>";
       session.setAttribute("test3text",text);
       return "test";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032050544](https://www.z4a.net/images/2024/02/22/image-20240207032050544.png)

### th:each

> th:each属性的作用：通过**session**传过来的**数组**，并将数据存到" **:** "前面的变量，**th:each**所在的标签及标签里的内容会根据**数组的数量**复制出来，复制出来的标签里，可以使用变量将数组的单个数据输出

1. 在**tr**标签里使用**th:each**

   - 第一个参数**value**及是对应数据的变量名，**tr**标签里**td**的**th:text**将数据显示出来
   - 第二个参数**status**以下属性：
     - **index**：数组下标
     - **count**：位于数组第几个[*从1开始计算*]
     - **size**：数组长度
     - **current**：当前的值，与第一个参数**value**相同
     - **odd / even**：是否为奇偶数
     - **first / last**：是否为第一个/最后一个

   ```html
   <div>
                   <h1>th:id|th:unless</h1>
                   <div style="position:relative;display: flex;justify-self: center;width: 500px;left: calc(50% - 250px)">
                       <table>
                           <tr>
                               <th>标题</th>
                               <th>数据</th>
                               <th>index</th>
                               <th>count</th>
                               <th>size</th>
                               <th>current</th>
                               <th>even偶</th>
                               <th>odd奇</th>
                               <th>first</th>
                               <th>last</th>
                           </tr>
                           <tr th:if="${session.test4Value.isEmpty()}">
                               <td colspan="10">无数据</td>
                           </tr>
                           <tr th:each="value,status:${session.test4Value}">
                               <td th:text="'测试数据'+${value}">测试数据</td>
                               <td th:text="${value}">0</td>
                               <td th:text="${status.index}"></td>
                               <td th:text="${status.count}"></td>
                               <td th:text="${status.size}"></td>
                               <td th:text="${status.current}"></td>
                               <td th:text="${status.even}"></td>
                               <td th:text="${status.odd}"></td>
                               <td th:text="${status.first}"></td>
                               <td th:text="${status.last}"></td>
                           </tr>
                       </table>
                   </div>
                   <h4>tips：点击下面增加和减少数据</h4>
               </div>
               <br/>
               <div>
                   <a class="btn p10-20 blue" href="/addTest4">增加一行数据</a>
                   <a class="btn p10-20 red" href="/delTest4">减少一行数据</a>
                   <a class="btn p10-20" href="/test">返回</a>
               </div>
   ```

2. 在**testController.java**添加对应方法，更新数组

   ```java
   @RequestMapping("/addTest4")
   public String changeTest3Add(HttpSession session){
       ArrayList<Integer> value = (ArrayList<Integer>)session.getAttribute("test4Value");
       value.add(value.size()+1);
       session.setAttribute("test4Value",value);
       return "redirect:/test4";
   }
   @RequestMapping("/delTest4")
   public String changeTest3Sub(HttpSession session){
       ArrayList<Integer> value = (ArrayList<Integer>)session.getAttribute("test4Value");
       if(!value.isEmpty()){
           value.remove(value.size()-1);
       }
       session.setAttribute("test4Value",value);
       return "redirect:/test4";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032110649](https://www.z4a.net/images/2024/02/22/image-20240207032110649.png)

### th:value

> **th:value**属性的作用：**替换**标签原有的**value**属性值

1. 写个表单，用来传输数据到后端，这里的**th:value**和**th:text**的属性值用了个**三元表达式**。*button的默认在表单里就是提交*

   `(session.test5Value == null) ? '' : session.test5Value`意思为**session.test5Value**为空时，这整个的值就是空的，什么都没有，如果不为空，就为**session.test5Value**，这种方法可以有效的防止**session的值**为**空指针**导致后端报错

   ```html
   <div>
       <h1>th:value</h1>
       <form method="post" action="/submitTest5">
           <input name="value" type="text" th:value="${(session.test5Value == null) ? '' : session.test5Value}"/>
           <button class="btn p8-10">保存</button>
           <div th:text="'你保存的文字：'+${(session.test5Value == null) ? '' : session.test5Value}"></div>
       </form>
       <h4>tips：通过表单发送数据给后端，后端在通过session传输到thymeleaf上处理，最后显示到前端</h4>
   </div>
   <br/>
   <div>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 如何将前端的值能够给后端接收呢？

   其实在方法写个**形参**[*一般为**String**类型*]，然后再类型前面加个注释**@RequestParam**，这个就是后端接收前端里**name**属性值为**value**[*属性**值***]的标签里**value**[*属性**名***]的值

   *如果不想以变量名作为前端的name的属性值，可以使用@RequestParam(value="name属性值")*

   ```java
   @RequestMapping("/submitTest5")
   public String changeTest5(HttpSession session, @RequestParam String value){
       session.setAttribute("test5Value",value);
       return "redirect:/test5";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032133650](https://www.z4a.net/images/2024/02/22/image-20240207032133650.png)

### th:style

> **th:style**属性的作用：**替换**标签原有的**style**属性值

1. class为testText的div就是用来看效果的，有点长，而且也用了三目表达式，*可以回想一下这些三目表达式有何作用*

   一段一段看，这里使用的都是字符串拼接

   - `'color:'+${(session.test6Color == null) ? 'black' : session.test6Color}`：这个其实给标签添加color样式，通过后端设置**session.test6Color**的值，最后**重新渲染页面**又返回到前端，例如**session.test6Color**的值=**red**，那这个最后显示在**div标签**上就是`style="color:red"`
   - `';background-color:'+${(session.test6BgColor == null) ? 'transparent' : session.test6BgColor}`：开头的分号[ **;** ]用于分开样式，学过**css**都知道的啦！与上一个同理，就是**session**的**键**不一样，例如**session.test6BgColor**的值=**blue**，最后显示在**div标签**上就是`style="background-color:blue"`
   - table部分就不怎么需要管了，就是传输数据让你更直观的看到效果

   ```html
   <div>
       <h1>th:style</h1>
       <form method="post" action="/submitTest6">
           <div class="testText" th:style="'color:'+${(session.test6Color == null) ? 'black' : session.test6Color}+';background-color:'+${(session.test6BgColor == null) ? 'transparent' : session.test6BgColor}">测试文字TestText</div>
           <table class="doubleTdLR">
               <tr>
                   <td>color</td>
                   <td>：<input name="color" type="text" th:value="${(session.test6Color == null) ? 'black' : session.test6Color}"/></td>
               </tr>
               <tr>
                   <td>background-color</td>
                   <td>：<input name="background_color" type="text" th:value="${(session.test6BgColor == null) ? 'transparent' : session.test6BgColor}"/></td>
               </tr>
           </table>
           <button class="btn p8-10">保存</button>
       </form>
       <h4>tips：无论怎么刷新，它的样式都还会在</h4>
   </div>
   <br/>
   <div>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 在**testController.java**设置**session**的值

   ```java
   @RequestMapping("/submitTest6")
   public String changeTest6(HttpSession session, @RequestParam String color, @RequestParam String background_color){
       session.setAttribute("test6Color",color);
       session.setAttribute("test6BgColor",background_color);
       return "redirect:/test6";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032213570](https://www.z4a.net/images/2024/02/22/image-20240207032213570.png)

### th:onclick | th:href

> **th:onclick **属性的作用：**替换**标签原有的**onclick **属性值，但是不支持session为字符串传到这个属性值里，会报错
>
> **th:href**属性的作用：**替换**标签原有的**href**属性值，不会有**th:onclick **的情况

1. 表单只是用来传数据看效果的，具体看第二个**大div**

   这里来说说thymeleaf里 支持两种写法

   - **字符串拼接**：这是最普通的写法
   - **||包裹**：使用||包裹可以让代码看起来更直观

   ```html
   <div>
       <h1>th:onclick | th:href</h1>
       <form method="post" action="/submitTest7">
           <input name="value" type="number" th:value="${(session.test7Value == null) ? '' : session.test7Value}"/>
           <button class="btn p8-10">保存</button>
       </form>
       <h4>tips：th:onclick不支持字符串，所以这里只演示了数字</h4>
   </div>
   <br/>
   <div>
       <button class="btn p10-20" th:onclick="'show('+${session.test7Value}+')'">button标签[字符串拼接]</button>
       <button class="btn p10-20" th:onclick="|show(${session.test7Value})|">button标签[||方式]</button>
       <a class="btn p10-20" th:href="'javascript:show('+${session.test7Value}+')'">a标签</a>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   <script>
       function show(value) {
           alert(value);
       }
   </script>
   ```

2. 在**testController.java**设置**session**的值，这里是数字所以要做一下处理，需判断是否为空，在将字符串转化成数字

   ```java
   @RequestMapping("/submitTest7")
   public String changeTest7(HttpSession session, @RequestParam String value){
       int val = 0;
       if(value!=null && !value.isEmpty()){
           val = Integer.parseInt(value);
       }
       session.setAttribute("test7Value",val);
       return "redirect:/test7";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032243151](https://www.z4a.net/images/2024/02/22/image-20240207032243151.png)

### th:switch | th:case

> **th:switch | th:case**：**前者的值**就是通过**session**作为**变量**，**后者的值**就是判断**前者的值**是否等于**后者的值**，若是则显示，反之，若**子标签**的属性**th:case="\*"**，就是变量的值不等于其他子标签的值，就会显示属性**th:case="\*"**的**子标签**

1. 使用**th:switch | th:case**需要有一个**div**或者其他的作为**载体**，并增加**th:switch**属性，里面的标签用**th:case**来判断

   ```html
   <div>
       <h1>th:switch | th:case</h1>
       <div th:switch="${session.test8Value}">
           <p th:case="1">你输入了1</p>
           <p th:case="2">你输入了2</p>
           <p th:case="3">你输入了3</p>
           <p th:case="4">你输入了4</p>
           <p th:case="5">你输入了5</p>
           <p th:case="*">你输入了其他乱七八糟的数字</p>
       </div>
       <form method="post" action="/submitTest8">
           <input name="value" type="number" th:value="${(session.test8Value == null) ? 0 : session.test8Value}"/>
           <button class="btn p8-10">保存</button>
       </form>
       <h4>tips：thymeleaf里的switch没有default，只有th:case="*"</h4>
   </div>
   <br/>
   <div>
       <a class="btn p10-20" href="/test">返回</a>
   </div>
   ```

2. 在**testController.java**设置**session**的值

   ```java
   @RequestMapping("/submitTest8")
   public String changeTest8(HttpSession session, @RequestParam String value){
       session.setAttribute("test8Value",value);
       return "redirect:/test8";
   }
   ```

3. 通过启动**demo**的**springboot**启动类启动查看效果

   ![image-20240207032306079](https://www.z4a.net/images/2024/02/22/image-20240207032306079.png)

# Thyemeleaf的全局对象

------

| 全局对象   | 作用                             |
| ---------- | -------------------------------- |
| #arrays    | 处理数组的方法                   |
| #bools     | 处理布尔值的方法                 |
| #calendars | 处理java.util.calender的工具对象 |
| #dates     | 处理java.util.date的工具对象     |
| #lists     | 处理List集合的方法               |
| #maps      | 处理map集合的方法                |
| #numbers   | 处理数字格式化的方法             |
| #sets      | 处理set集合的方法                |
| #strings   | 处理字符串的方法                 |

*每个变量的方法都特别多，不方便做教程，但是根据方法的名字还是能知道它有什么用*

# demo

------

[github](https://github.com/Turing158/SpringBootThymeleaf)

[gitee](https://gitee.com/turing-ice/SpringBootThymeleaf)
