import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

//added after initial deployment
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class MyMohApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /*
    // This creates a new CodeCommit repository called 'WorkshopRepo'
    const repo = new codecommit.Repository(this, 'WorkshopNewRepo', {
        repositoryName: "WorkshopNewRepo"
    });

    const pipeline = new CodePipeline(this, 'NewPipeline', {
      pipelineName: 'MyNewPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.codeCommit(repo,'master'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
    */
    //added after initial deployment
    const defaultVpc = ec2.Vpc.fromLookup(this, 'default-vpc-id', {
      isDefault: true,
    });

    // in a real deployment we would lookup a specific VPC and subnets
    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: defaultVpc
    });
    
    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      assignPublicIp: true, // This wont be realistic in an ASEA environment...
      cpu: 256, // Default is 256
      desiredCount: 3, // Default is 1
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample") },
      memoryLimitMiB: 1024, // Default is 512
      publicLoadBalancer: true // Default is true
    });
    
    const scalableTarget = loadBalancedFargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 20,
    });
    
    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });
    
    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 50,
    });
    
  }
}
