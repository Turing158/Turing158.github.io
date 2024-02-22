# SpringBoot使用RabbitMQ



### 介绍

> RabbitMQ是用Erlang实现的一个**高并发高可靠AMQP消息队列**服务器。支持消息的持久化、事务、拥塞控制、负载均衡等特性，主要是为了实现系统之间的双向解耦

![概念图](https://www.z4a.net/images/2024/02/22/c65b0e005c026a9582234fd16da583ba.png)
### 优点

> 解耦、异步提升效率、流量削峰[高并发]

### 缺点

> **系统的可用性降低**：引入的外部依赖越多，系统越容易崩掉
>
> **系统的复杂性提高**：考虑的问题会变的多很多，如何保证消息没有重复消费？如何保证消息不丢失？怎么保证消息传递的顺序？
>
> **一致性问题**：假设ABC系统，A系统发送完消息直接返回成功，但是BC系统之中若有系统写库失败，则会产生数据不一致

### 安装

1. 安装并配置erlang

   > 安装地址：[https://www.erlang.org/downloads](https://www.erlang.org/downloads)
   >
   > 新建系统变量：ERLANG_HOME=安装路径[能看到bin目录的]

2. 安装RabbitMQ

   > 安装地址：[https://www.rabbitmq.com/install-windows.html](https://www.rabbitmq.com/install-windows.html)
   >
   > 新建系统变量：RABBITMQ_SERVER=安装路径/rabbitmq_server-版本
   >
   > 在path中添加：%RABBITMQ_SERVER%\sbin

3. 安装RabbitMQ可视化工具

   在RabbitMQ的路径下/sbin目录下执行
   
   > 安装web可视化工具	`rabbitmq-plugins.bat enable rabbitmq_management`
   >
   > 安装服务 	`rabbitmq-service.bat install`
   >
   > 启动服务	`rabbitmq-server.bat start`
   
   访问：localhost:15672 可访问控制台，用户密码为guest

***

### 配置RabbitMQ

1. 添加pom

   在原有的springboot基础配置的dependency的基础上加上

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-amqp</artifactId>
       <version>3.1.0</version><!--这一行是版本号，可删除，前提是有配置springboot的parent-->
   </dependency>
   ```

2. 配置Springboot配置文件

   在resources的application.yml中添加

   ```yml
   # application.yml
   spring:
     application:
       name: Spring-boot-rabbitmq
     rabbitmq:
       host: localhost
       port: 5672
       username: guest
       password: guest
       
   ```
    或者在application.properties中添加

   ```properties
   #   application.properties
   spring.application.name=Spring-boot-rabbitmq
   spring.rabbitmq.host=localhost
   spring.rabbitmq.port=5672
   spring.rabbitmq.username=guest
   spring.rabbitmq.password=guest
   ```

***

### 简单的使用RabbitMQ

1. 队列配置

   这里得讲一下都代表什么，这是**最基础**的队列配置，配置了一个名为**hello**的队列

   ```java
   //RabbitConfig.java
   @Configuration
   public class RabbitConfig {
       @Bean
       public Queue Queue(){
           return new Queue("hello");
       }
   }
   ```
   若想添加多个队列，只需安装上面的模板添加队列就行，例如
   ```java
   //RabbitConfig.java
   @Configuration
   public class RabbitConfig {
       @Bean
       public Queue Queue(){
           return new Queue("one");
       }
       @Bean
       public Queue 方法名(){
           return new Queue("队列名");
       }
      //或者
       @Bean
       public Queue 队列名(){
           return new Queue("队列名");
       }
   }
   ```

2. 发送者

所谓发送者，就是将队列消息发送的人[类/方法]，*@Component注解用于将该类可以被Spring容器管理*

```java
//Person1Sender.java
@Component
public class Person1Sender {
    @Autowired
    private AmqpTemplate rabbitTemplate;
    public void send(){
        String context = "hello我是Person1";
        System.out.println("Sender发出去的信息:"+context);
        //这个的第一个参数在这里可以说是队列名，但是这个的全名叫routing_key[路由健],之后会讲到
        this.rabbitTemplate.convertAndSend("one",context);
    }
}
```

 通过注入**AmqpTemplate**，让sender将消息发送的**one**队列,context就是发送的内容，呈键值对一般

```this.rabbitTemplate.convertAndSend("one",context);```

3. 接收者

   接收者可以接收队列发过来的消息,注解**@RabbitListener(queques="队列名")**是为了监听此队列是否有消息，并通过注解**@RabbitHandler**所对应的方法中加入形参来接收队列的消息

   ```java
   //Person2Receiver.java
   @Component
   @RabbitListener(queues = "one")
   public class Person2Receiver {
       @RabbitHandler
       public void process(String one){
           System.out.println("Person2接收到的信息:"+one);
       }
   }
   ```

4. 测试

   在Controller中，先通过注入**Person1Sender**对象，然后再测试控制类中的方法写上**person1Sender.send()**,其实就相当于new了**Person1Sender**对象，然后调用了**Person1Sender**里的**send()**方法，最后再浏览器输入**localhost:8080**查看控制台就知道效果了

   ```java
   //test.java
   @Controller
   public class testController {
       @Autowired
       Person1Sender person1Sender;
       @RequestMapping("/")
       @ResponseBody
       public String test(){
           person1Sender.send();
           return "test";
       }
   }
   ```
   
   效果：![image-20240127203952345](https://www.z4a.net/images/2024/02/22\image-20240127203952345.png)
   
   ------
   
   

### 多对多

顾名思义就是，实验**一个发送者对多个接收者**和**多个发送者对多个接收者**

1. **一对多**

   1. 修改一下 **Person1sender.java**

   ```java
   //Person1Sender.java
   @Component
   public class Person1Sender {
       @Autowired
       private AmqpTemplate rabbitTemplate;
       public void send(int i){
           String context = "hello我是Person1---------------"+i;
           this.rabbitTemplate.convertAndSend("one",context);
       }
   }
   ```

   2. 添加一个**Person3Receiver.java**，跟**Person1Receiver.java**简直是**的一模一样

   ```java
   @Component
   @RabbitListener(queues = "one")
   public class Person3Receiver {
       @RabbitHandler
       public void process(String msg){
           System.out.println("Person3接收到的信息:"+msg);
       }
   }
   ```

   3. 再修改一下测试控制类

   ```java
   //testController.java
   @Controller
   public class testController {
       @Autowired
       Person1Sender person1Sender;
       @RequestMapping("/")
       @ResponseBody
       public String test(){
           for (int i = 0; i < 50; i++) {
               person1Sender.send(i);
           }
           return "test";
       }
   }
   ```

   4. 运行之后，看下控制台

   ![image-20240125220318175](https://www.z4a.net/images/2024/02/22\image-20240125220318175.png)

   突然发现，**person2**和**person3**接收的消息都是**一半一半**的，都是你一个我一个

2. 多对多

   1. 直接添加一个**Person4Sender.java**，简直跟**Person1Sender.java****的一模一样

   ```java
   //Person4Sender.java
   @Component
   public class Person4Sender {
       @Autowired
       private AmqpTemplate rabbitTemplate;
       public void send(int i){
           String context = "hello我是Person4---------------"+i;
           this.rabbitTemplate.convertAndSend("one",context);
       }
   }
   ```

   2. 再修改一下测试控制类
   
   ```java
   //testController.java
   @Controller
   public class testController {
       @Autowired
       Person1Sender person1Sender;
       @Autowired
       Person4Sender person4Sender;
       
       @RequestMapping("/")
       @ResponseBody
       public String test(){
           for (int i = 0; i < 50; i++) {
               person1Sender.send(i);
               person4Sender.send(i);
           }
           return "test";
       }
   }
   ```
   
   3. 重新启动运行下看控制台
   
   ![image-20240125221409953](https://www.z4a.net/images/2024/02/22\image-20240125221409953.png)
   
   真**神奇，3接4的消息，2接1的消息，也是一半一半
   
   **总结**：说明接收者无论怎样，都会均匀的接收消息
   
   ------
   
   

### 对于传对象的支持

​	不需要任何配置，直接**将String换成Object**就行

------



### 不同类型的Exchange

在RabbitMQ中，引入了两个概念

1. **routing_key**[路由键]

   用于绑定队列，每个队列都对应有个**路由键**，必须是一串字符，用句号（ . ） 隔开，例如 topic.msg

2. **exchange**[交换机]

   交换机的主要功能是**接收**消息并且**转发**到绑定的队列，不会储存消息

   ![概念图](https://www.z4a.net/images/2024/02/22/概念图.png)

   交换机有**四种**类型

   1. **Direct**[默认]：直接通过匹配所绑定**routing_key**的队列，再对所监听**routing_key**队列的方法进行调用，简单一点就是匹配队列名，然后调用监听队列名的方法，最简单的使用RabbitMQ

   2. **Topic**：通过给**routing_key**制定规则，可使用以下两个**通配符**

      `*`表示一个词

      `#`表示零个或多个词

      例如：

      topic.msg.*	[表示路由键必须是"topic.msg.随意一个词" =>(topic.msg.random)√ 	(topic.msg.a.b)×] `其实*可以省略不写`

      topic.msgs.#	[表示路由键必须是以"topic.msgs"开头的所有路由键都行=>(topic.msgs.a.b)√	(topic.msgs)√	(topic.msg.random)×]

   3. **Headers**：也是根据规则匹配，但是自定义程度高，性能不怎么好，一般不会使用

   4. **Fanout**：其词意思为"展开"，就是广播模式，不管设置了多少个路由键和交换机类型，直接将消息发送给绑定该交换机的全部队列

      OKOK，了解完概念，直接上demo来理解

      ------

      
   
      #### **Topic**
      
      1. 配置Topic类型交换机及所对应的队列
      
      ```java
      //TopicRabbitMQConfig.java
      @Configuration
      public class TopicRabbitMQConfig {
          @Bean
          public Queue queueMsg(){
              return new Queue("msg");
          }
          @Bean
          public Queue queueMsgs(){
              return new Queue("msgs");
          }
      
          @Bean
          public TopicExchange exchange(){
              return new TopicExchange("exchange");
          }
          @Bean
          public Binding BindingExchangeMsg(Queue queueMsg,TopicExchange exchange){
              return BindingBuilder.bind(queueMsg).to(exchange).with("topic.msg");
          }
          @Bean
          public Binding BindingExchangeMsgs(Queue queueMsgs,TopicExchange exchange){
              return BindingBuilder.bind(queueMsgs).to(exchange).with("topic.#");
          }
      ```
   
      *好像有点长，没事，一Bean一Bean讲解*
      
      首先，最收悉不过的**添加队列**，这里添加了两个队列分别为**msg**和**msgs**，其实这不重要，区分一下就行了
      
      ```java
          @Bean
          public Queue queueMsg(){
              return new Queue("msg");
          }
          @Bean
          public Queue queueMsgs(){
              return new Queue("msgs");
          }
      ```
      
      然后，将Topic类型引出来，并将交换机名取为`exchange`，最好**方法名**和**交换机**名一样，免得搞混
      
      ```java
          @Bean
          public TopicExchange exchange(){
              return new TopicExchange("exchange");
          }
      ```
      
      最后，将两个队列分别绑定到对应的路由键规则上，这里得注意几点，这里的**形参的名字**一定要和上面的**方法名**一样，因为再SpringBoot中，使用了@Bean注解
      
      ```java
          @Bean
          public Binding BindingExchangeMsg(Queue queueMsg,TopicExchange exchange){
              return BindingBuilder.bind(queueMsg).to(exchange).with("topic.msg");
          }
          @Bean
          public Binding BindingExchangeMsgs(Queue queueMsgs,TopicExchange exchange){
              return BindingBuilder.bind(queueMsgs).to(exchange).with("topic.#");
          }
      ```
      
      如果还看不懂，简化一下，这下你总看得懂了吧，方法名最好规范一点"BindingExchange队列名"，别到时候谁都看不懂你的代码
      
      ```java
          @Bean
          public Binding 方法名(Queue 队列方法名,交换机类型 交换机名字){
              return BindingBuilder.bind(队列方法名).to(交换机名字).with("路由键规则");
          }
      ```
      
      2. 添加Person5Sender.java
      
         这个**sender**可能有点不一样，特别是`rabbitTemplate.convertAndSend`
      
         > 第一个值：交换机名字[**exchange**]
         >
         > 第二个值：路由键[**routing_key**]
         >
         > 第三个值：消息[**context**]
      
         我这里设置了比较多的方法
      
      ```java
         //Person5Sender.java
         @Component
         public class Person5Sender {
             @Autowired
             private AmqpTemplate rabbitTemplate;
             
             public void send1(){
                 String context = "hello我是Person5,RoutingKey为topic.msg";
                 this.rabbitTemplate.convertAndSend("exchange","topic.msg",context);
             }
             public void send2(){
                 String context = "hello我是Person5,RoutingKey为topic.msgs";
                 this.rabbitTemplate.convertAndSend("exchange","topic.msgs",context);
             }
             public void send3(){
                 String context = "hello我是Person5,RoutingKey为topic.random";
                 this.rabbitTemplate.convertAndSend("exchange","topic.random",context);
             }
             public void send4(){
                 String context = "hello我是Person5,RoutingKey为topic.";
                 this.rabbitTemplate.convertAndSend("exchange","topic",context);
             }
      ```
      
      为了方便，我单独拎出来一个方法**send1()**来分析一波
      
      - 这个方法用于发送消息，**context**变量为消息
      
      - **AmqpTemplate**的**convertAndSend**方法的三个值：
      
        > 第一个值：交换机名字[**exchange**]
        >
        > 第二个值：路由键[**routing_key**]
        >
        > 第三个值：消息[**context**]
      
      - 这里主要是注意**路由键**
      
        这里的路由键会经过**Topic**类型的交换机[**exchange**]，然后，交换机会通过匹配你所填写的**路由键**，并将消息放在**匹配**到的队列中
      
      ```java
              public void send1(){
                 String context = "hello我是Person5,RoutingKey为topic.msg";
                 this.rabbitTemplate.convertAndSend("exchange","topic.msg",context);
             }
      ```
      
      3. 添加Receivers.java
      
         *这个类，我直接把接收者变成一个方法*
      
         ```java
         //Receivers.java
         @Component
         public class Receivers {
             @RabbitListener(queues = "msg")
             @RabbitHandler
             public void person6(String msg){
                 System.out.println("Person6接收到的信息:"+msg);
             }
             @RabbitListener(queues = "msgs")
             @RabbitHandler
             public void person7(String msg){
                 System.out.println("Person7接收到的信息:"+msg);
             }
         }
         ```
         
         随便拎出来一个方法，分析一波
         
         - **@RabbitListener**注解：用于**监听**该队列的消息，需要**搭配@RabbitHandler**一起使用，queues的值为配置时的队列名
         - **@RabbitHandler**注解：用于**绑定**监听到该队列消息后的**方法**
         - 方法的形参：方法的**形参**名字不一定要一样，但是要与监听到的消息的**类型一样**
         
         ```java
             @RabbitListener(queues = "msg")
             @RabbitHandler0
             public void person6(String msg){
                 System.out.println("Person6接收到的信息:"+msg);
             }
         ```
         
      4. 修改testController.java
      
         ```java
         //testController.java
         @Controller
         public class testController {
             @Autowired
             Person5Sender person5Sender;
             @RequestMapping("/")
             @ResponseBody
             public String test() throws InterruptedException {
                 person5Sender.send1();
                 Thread.sleep(1000);
                 System.out.println("==================================");
                 person5Sender.send2();
                 Thread.sleep(1000);
                 System.out.println("==================================");
                 person5Sender.send3();
                 Thread.sleep(1000);
                 System.out.println("==================================");
                 person5Sender.send4();
                 return "test";
             }
         }
         ```
      
         调用**Person5Sender**的四个方法，并加点延迟区分一下，可得结果↓
      
         ![image-20240129150721894](https://www.z4a.net/images/2024/02/22\image-20240129150721894.png)
      
         其实者很明显了
         
         1. 第一组：
         
            路由键为**topic.msg**，那就看看符不符合通配符的匹配
         
            第一个队列路由键的规则：**topic.msg**，也就是说，发送者的路由键也必须是**topic.msg**才能将消息发送到**msg队列**，所以，**msg队列**有消息被存入，触发了**Person6()**
         
            第二个队列路由键的规则：**topic.#**，也就是说，发送者的路由键只要是**topic**字母开头，`.`后面无论有还是没有，都能将消息发送到**msgs队列**，从而触发**Person7()**
         
         2. 第二、三、四组：
         
            路由键都要么是**topic.**后面加**一个**词或**多个**词的，要么是只有**topic**的，只能符合**topic.#**这个规则，从而触发**Person7()**
         
         **总结**：其实**Topic**类型也是挺好理解的，重点在于路由键规则的指定和匹配
      
      ------
      
      
      
      #### **Headers**
      
      headers是自定义匹配规则类型，需要用到的对象比较多，所以性能比较低，一般不会使用
      
      他的自定义匹配规则为设定一组键值对规则，然后发送者中也会设定一组键值对规则，当绑定了队列`BindingBuilder.bind(queue).to(headersExchange)`加上的是`.whereAll(map).match()`，那发送者必须全部正确匹配才会将消息发送到绑定的队列；而加上`.whereAny(map).match()`，那发送者所设置的键值对只需包含在配置文件里的键值对就行
      
      ------
      
      
      
      #### **Fanout**
      
      1. 同样的先配置**Fanout**的交换机和用于**测试的队列**，创建一个FanoutRabbitMQConfig.java
      
         ```java
         //FanoutRabbitMQConfig.java
         @Configuration
         public class FanoutRabbitMQConfig {
             @Bean
             public Queue queueRadio(){
                 return new Queue("radio");
             }
             @Bean
             public Queue queueTV(){
                 return new Queue("tv");
             }
             @Bean
             public Queue queuePhone(){
                 return new Queue("phone");
             }
             @Bean
             public FanoutExchange fanoutExchange(){
                 return new FanoutExchange("fanoutExchange");
             }
             @Bean
             public Binding bindingExchangeRadio(Queue queueRadio,FanoutExchange fanoutExchange){
                 return  BindingBuilder.bind(queueRadio).to(fanoutExchange);
             }
             @Bean
             public Binding bindingExchangeTV(Queue queueTV,FanoutExchange fanoutExchange){
                 return  BindingBuilder.bind(queueTV).to(fanoutExchange);
             }
             @Bean
             public Binding bindingExchangePhone(Queue queuePhone,FanoutExchange fanoutExchange){
                 return  BindingBuilder.bind(queuePhone).to(fanoutExchange);
             }
         }
         ```
      
         这个应该都挺好懂得了吧，就是把**radio、tv、phone队列**都绑定到**FanoutExchange**上
      
      2. 添加发送者，FanoutSender.java，分别给三个方法随便取了三个不同的**路由键**
      
         ```java
         //FanoutSender.java
         @Component
         public class FanoutSender {
             @Autowired
             private AmqpTemplate rabbitTemplate;
             public void send1(){
                 String context = "我是FanoutSender,发送了send1,路由键为'abcdefg'";
                 this.rabbitTemplate.convertAndSend("fanoutExchange","abcdefg", context);
             }
             public void send2(){
                 String context = "我是FanoutSender,发送了send2,路由键为' '";
                 this.rabbitTemplate.convertAndSend("fanoutExchange","", context);
             }
             public void send3(){
                 String context = "我是FanoutSender,发送了send3,路由键为'fanout'";
                 this.rabbitTemplate.convertAndSend("fanoutExchange","fanout", context);
             }
         }
         ```
      
      3. 添加接收者 FanoutReceiver.java，用于**监听**对应**队列**的消息
      
         ```java
         //FanoutReceiver.java
         @Component
         public class FanoutReceiver {
             @RabbitListener(queues = "radio")
             @RabbitHandler
             public void radio(String msg){
                 System.out.println("监听radio："+msg);
             }
             @RabbitListener(queues = "phone")
             @RabbitHandler
             public void phone(String msg){
                 System.out.println("监听phone："+msg);
             }
             @RabbitListener(queues = "tv")
             @RabbitHandler
             public void tv(String msg){
                 System.out.println("监听tv："+msg);
             }
         }
         ```
      
      4. 修改测试控制类testController.java
      
         ```java
         //testController.java
         @Controller
         public class testController {
             @Autowired
             FanoutSender fanoutSender;
             @RequestMapping("/")
             @ResponseBody
             public String test() throws InterruptedException {
                 fanoutSender.send1();
                 Thread.sleep(1000);
                 System.out.println("==========================");
                 fanoutSender.send2();
                 Thread.sleep(1000);
                 System.out.println("==========================");
                 fanoutSender.send3();
                 return "test";
             }
         }
         ```
      
         查看效果
      
         ![image-20240129171749376](https://www.z4a.net/images/2024/02/22\image-20240129171749376.png)
      
         **总结**：很明显了，这三个队列无论发送者是什么路由键，他都会将消息发送到三个队列中

### 参考文档：

[Spring Boot3.0(八)：消息队列 RabbitMQ 详解 - 纯洁的微笑博客 (ityouknow.com)](http://www.ityouknow.com/springboot/2023/01/08/spring-boot-rabbitMQ.html)